<?php
// popity.ro projects: the single source for /projects/ and /projects/<name>/.
// To add a project, add one entry below. It shows up in the `ls -l` listing
// (in this order) and gets its own page at /projects/<name>/.
//
//   name         folder name and URL slug: lowercase letters, digits and dashes
//   date         YYYY-MM-DD, shown in the `ls -l` line
//   comment      one-line description, shown as "# ..." in the listing
//   title        heading of the README
//   description  README paragraphs, one string each
//   stack        list of technologies, joined with " · "
//   status       one line
//   link         source repository
//   demo         optional: folder of a static demo inside /projects/<name>/,
//                with 'url', the 'date' the snapshot was taken (YYYY-MM-DD)
//                and a short 'note' on what the demo shows

return [
    [
        'name'        => 'wifi-scanner',
        'date'        => '2026-10-22',
        'comment'     => 'walk around the house with a laptop until the dead zone admits it exists',
        'title'       => 'Wi-Fi Scanner: Home Walk-Test & Coverage Mapping',
        'description' => [
            "A local Windows app I carry around the house to find out where the Wi-Fi actually dies.",
            "It reads the live signal (RSSI in dBm), channel, band and link speed straight from the Wi-Fi card, pings the router to track latency, jitter and packet loss, and shows it all on a big dashboard I can read at arm's length.",
            "I tap the room I'm standing in, drop pins on a floorplan heatmap, and it spots mesh roaming and band steering as I walk. At the end it tells me where an extender would actually help.",
            "No cloud and no pip installs: it's plain Python talking to Windows' own Wi-Fi libraries, served on 127.0.0.1.",
        ],
        'stack'       => ['Python (standard library only, ctypes into wlanapi.dll and iphlpapi.dll)', 'plain HTML/CSS/JS'],
        'status'      => 'working, Windows only',
        'link'        => 'https://github.com/spopity/wifi-scanner',
        'demo'        => ['url' => 'demo/', 'date' => '2026-10-22', 'note' => 'an evening walk-test through four rooms, with network names and MAC addresses masked'],
    ],
    [
        'name'        => 'network-ai-toolkit',
        'date'        => '2026-09-16',
        'comment'     => 'a one-router NOC with an AI that asks before touching anything',
        'title'       => 'Network AI: ASUS Router Monitoring & AI Troubleshooting',
        'description' => [
            "A self-hosted toolkit that looks after my home network: an ASUS RT-AX88U Pro with AiMesh nodes on Asuswrt-Merlin. Every 5 minutes it checks the router's health over SSH, keeps the history in Postgres and shows it all on a mobile-friendly dashboard.",
            "A PPPoE watchdog restarts the WAN when the line drops, so I usually hear about an outage after it's fixed. To keep the AI bill small, Gemini reads the logs only once a day, after they're compressed into templates.",
            "Tshoot is the chat part: describe a problem and it investigates on the router itself. Read-only commands run freely, any change waits for my approval, destructive commands are always blocked, and secrets are redacted before anything reaches the AI.",
        ],
        'stack'       => ['Python', 'Flask', 'Paramiko (SSH)', 'Gemini + local Ollama', 'PostgreSQL', 'React + TypeScript', 'systemd'],
        'status'      => 'in daily use at home, watching every packet',
        'link'        => 'https://github.com/spopity/network-ai-toolkit',
        'demo'        => ['url' => 'demo/', 'date' => '2026-10-21', 'note' => 'Tshoot replays real investigations, with addresses and device names masked'],
    ],
    [
        'name'        => 'ai-endurance-coach',
        'date'        => '2026-07-26',
        'comment'     => 'a coach that never lets me skip a recovery week',
        'title'       => 'AI Endurance Coach',
        'description' => [
            "A self-hosted team of AI agents that coaches my cycling. It reads my rides, HRV and sleep from Intervals.icu, Strava and a Withings scale, then tells me what to do next, with more confidence than I'd like.",
            "Five specialists share the work: a head coach, an injury watchdog, a race strategist, a history analyst and a digital twin that calculates how long Alpe d'Huez would take if I lost 3 kg. (Still too long.)",
            "Rule #1: numbers come from code, words come from the AI, so it never invents a single watt. It answers through a web dashboard, a Telegram morning briefing, and short notes on my Strava activities.",
        ],
        'stack'       => ['Python', 'LangGraph', 'Gemini + local Ollama', 'PostgreSQL', 'React'],
        'status'      => 'running 24/7, judging every ride',
        'link'        => 'https://github.com/spopity/ai-endurance-coach',
        'demo'        => ['url' => 'demo/', 'date' => '2026-10-21', 'note' => 'the chat replays answers the coach really gave'],
    ],
];
