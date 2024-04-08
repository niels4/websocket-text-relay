## 1.1.0 - 2024/04/07

Increased default security.

By default, the http and websocket server will only accept incoming connections from your local machine. If you
wish to allow network access you must set the `allow_network_access` option to true when configuring your editor plugin.

### For Neovim clients

```lua
  { 'niels4/websocket-text-relay.nvim', opts = {
      allow_network_access = true
  }},
```

By default, the http and websocket server will only accept connections where the hostname is `localhost`. If you wish
to allow other hosts to connect to the websocket server, you must explicitly allow them using the `allowed_hosts` option when configuring your editor plugin.

### For Neovim clients

```lua
  { 'niels4/websocket-text-relay.nvim', opts = {
      allowed_hosts = { "some-allowed-host.test", "some-other-host.test" },
  }},
```
