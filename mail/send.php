<?php
// popity.ro contact form handler.
// The destination address lives only here, on the server, never in the HTML.

const TO_ADDRESS   = 'seba@popity.ro';
const MAX_SUBJECT  = 150;
const MAX_MESSAGE  = 5000;
const MIN_ELAPSED  = 3000;               // ms on the page before sending; bots are faster
const RATE_LIMIT   = 3;                  // messages per IP...
const RATE_WINDOW  = 600;                // ...per 10 minutes

// Character count that works with or without the mbstring extension.
function charCount(string $s): int {
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : (int)preg_match_all('/./su', $s);
}

function respond(bool $ok, string $error = ''): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit;
}

$from    = trim((string)($_POST['from'] ?? ''));
$subject = trim((string)($_POST['subject'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));
$trap    = (string)($_POST['website'] ?? '');
$elapsed = (int)($_POST['elapsed'] ?? 0);

// Spam traps: the form is sent by JavaScript, which fills "elapsed" and never
// the hidden "website" field. Anything else is a bot: pretend success so it learns nothing.
if ($trap !== '' || $elapsed < MIN_ELAPSED) {
    respond(true);
}

// Validate the return address: syntax, no header injection, and a domain that can receive mail.
if ($from === '' || strlen($from) > 254 || preg_match('/[\r\n]/', $from)
    || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'invalid address in From: please enter a valid email.');
}
$domain = substr(strrchr($from, '@'), 1);
if (function_exists('checkdnsrr') && !checkdnsrr($domain, 'MX') && !checkdnsrr($domain, 'A')) {
    respond(false, "the domain {$domain} does not accept email.");
}

$subject = preg_replace('/[\r\n\t]+/', ' ', $subject);
if ($subject === '' || charCount($subject) > MAX_SUBJECT) {
    respond(false, 'Subject: is empty or too long.');
}
if ($message === '' || charCount($message) > MAX_MESSAGE) {
    respond(false, 'message is empty or too long.');
}

// Simple per-IP rate limit. Only a salted hash of the IP is kept, for 10 minutes.
$ipHash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . __FILE__);
$rateFile = sys_get_temp_dir() . '/popity_mail_' . $ipHash;
$now = time();
$hits = [];
if (is_file($rateFile)) {
    $hits = array_filter(
        (array)json_decode((string)@file_get_contents($rateFile), true),
        fn($t) => is_int($t) && $t > $now - RATE_WINDOW
    );
}
if (count($hits) >= RATE_LIMIT) {
    respond(false, 'too many messages, please try again in a few minutes.');
}
$hits[] = $now;
@file_put_contents($rateFile, json_encode(array_values($hits)), LOCK_EX);

// SMTP login for the form's own mailbox. The file sits OUTSIDE public_html
// (/home/<user>/popity-smtp.php), so it can never be downloaded from the web:
// <?php return ['host' => 'mail.popity.ro', 'port' => 465,
//               'user' => 'form@popity.ro', 'pass' => '...'];
$configFile = dirname(__DIR__, 2) . '/popity-smtp.php';
$logFile    = dirname(__DIR__, 2) . '/popity-mail.log';
$smtp = is_file($configFile) ? require $configFile : null;
if (!is_array($smtp) || empty($smtp['user']) || empty($smtp['pass'])) {
    @error_log(date('c') . " SMTP config missing or incomplete: {$configFile}\n", 3, $logFile);
    respond(false, 'could not send your message, please try again later.');
}

$body = "From: {$from}\n"
      . "Subject: {$subject}\n"
      . "Sent: " . gmdate('Y-m-d H:i') . " UTC\n"
      . str_repeat('-', 40) . "\n\n"
      . $message . "\n";

$error = smtpSend($smtp, TO_ADDRESS, $from, '[popity.ro] ' . $subject, $body);
if ($error !== null) {
    @error_log(date('c') . " SMTP: {$error}\n", 3, $logFile);
}
respond($error === null, $error === null ? '' : 'could not send your message, please try again later.');

// Minimal authenticated SMTP client (implicit TLS, AUTH LOGIN). Returns null on success, or the error.
function smtpSend(array $cfg, string $to, string $replyTo, string $subject, string $body): ?string {
    $host = $cfg['host'] ?? 'mail.popity.ro';
    $port = (int)($cfg['port'] ?? 465);
    $user = $cfg['user'];
    $fp = @stream_socket_client("ssl://{$host}:{$port}", $errno, $errstr, 15);
    if (!$fp) return "connect {$host}:{$port} failed: {$errstr}";
    stream_set_timeout($fp, 15);

    $read = function () use ($fp): string {
        $resp = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $resp .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') break;
        }
        return $resp;
    };
    // $label is what gets logged on failure, so credentials never reach the log.
    $cmd = function (?string $line, string $expect, string $label) use ($fp, $read): ?string {
        if ($line !== null) fwrite($fp, $line . "\r\n");
        $resp = $read();
        return strncmp($resp, $expect, 3) === 0 ? null : $label . ': ' . trim($resp);
    };

    $data = implode("\r\n", [
        'Date: ' . date('r'),
        'From: popity.ro <' . $user . '>',
        'To: <' . $to . '>',
        'Reply-To: <' . $replyTo . '>',
        'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
        'Message-ID: <' . bin2hex(random_bytes(12)) . '@popity.ro>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: quoted-printable',
        '',
        // quoted_printable_encode() only keeps CRLF as a line break (a bare LF becomes "=0A")
        quoted_printable_encode(str_replace(["\r\n", "\r", "\n"], ["\n", "\n", "\r\n"], $body)),
    ]);
    $data = preg_replace('/^\./m', '..', str_replace(["\r\n", "\n"], ["\n", "\r\n"], $data));

    $err = $cmd(null, '220', 'greeting')
        ?? $cmd('EHLO popity.ro', '250', 'EHLO')
        ?? $cmd('AUTH LOGIN', '334', 'AUTH')
        ?? $cmd(base64_encode($user), '334', 'AUTH user')
        ?? $cmd(base64_encode($cfg['pass']), '235', 'AUTH password')
        ?? $cmd("MAIL FROM:<{$user}>", '250', 'MAIL FROM')
        ?? $cmd("RCPT TO:<{$to}>", '250', 'RCPT TO')
        ?? $cmd('DATA', '354', 'DATA')
        ?? $cmd($data . "\r\n.", '250', 'message');
    @fwrite($fp, "QUIT\r\n");
    fclose($fp);
    return $err;
}
