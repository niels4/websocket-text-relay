# Developers Guide: Getting Started

In this tutorial you will learn how to:
 - Check out the repo and run unit tests
 - Configure your editor to run the language server from local source
 - Start in debugging mode and use the chrome inspector to set breakpoints and step through code
 - Live edit the status UI

## Check out the repo

In this example we will be checking out the repo into the `~/dev/src` directory.

```
mkdir -p ~/dev/src
cd ~/dev/src
git clone https://github.com/niels4/websocket-text-relay.git
cd websocket-text-relay
npm install
npm test
```

## Configure your editor

### Neovim

You can override the command to start up the language server using the setup options.

```lua

local home_dir = vim.fn.resolve(os.getenv("HOME"))

require('lazy').setup {

  { 'niels4/websocket-text-relay.nvim', opts = {
    cmd = { "node", "--inspect",  home_dir .. "/dev/src/websocket-text-relay/start.js" }
  }}

}

```

If you wish to pause the language server on startup so you can set break points on the init functions,
you should use the `--inspect-brk` option instead. You will need to open the chrome debugger and choose
to continue the execution before the language server will start up if you choose this option.

```lua
    cmd = { "node", "--inspect-brk",  home_dir .. "/dev/src/websocket-text-relay/start.js" }
```

## Edit Status UI

With the language server running, you can connect to the status UI by opening your browser to [http://localhost:38378](http://localhost:38378)

You should be able to see at least 1 editor and 1 client (the status UI itself)

The UI was built using websocket-text-relay, so we can live edit the UI as its running.

Open up the file `src/ui/js/util/constants.js`. Make changes to the outer and inner ring radius variables. You should see the UI update as you make changes.

You can do the same with the main.css file. Try changing around some of the colors.

## Understanding the code structure

To effectively make any changes to the application, you will need to understand the [overall code structure](./code-structure.md)
