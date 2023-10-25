module.exports = {
  apps : [{
    name: "app-3001",
    script: "./app.js",
    instances : "max",
    exec_mode : "cluster",
    env: {
      NODE_ENV: "development",
      PORT: 3001
    }
  },
  {
    name: "app-3002",
    script: "./app.js",
    instances : "max",
    exec_mode : "cluster",
    env: {
      NODE_ENV: "development",
      PORT: 3002
    }
  },
  {
    name: "app-3003",
    script: "./app.js",
    instances : "max",
    exec_mode : "cluster",
    env: {
      NODE_ENV: "development",
      PORT: 3003
    }
  }]
}

