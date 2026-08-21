# cast-control-web

Local-only web controls for `cast-mcp`.

- Speaker buttons across the top
- Big `Play PHM` button for Project Hail Mary
- Text box to send local TTS to the selected speaker

The browser never receives the `cast-mcp` token. This app calls `cast-mcp` server-side.

## Route

`https://home.dev.prettybird.zapplebee.online`

Traefik restricts access to:

- `192.168.1.0/24`
- `192.168.3.0/24`
