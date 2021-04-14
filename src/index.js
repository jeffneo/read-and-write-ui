import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
// import { CssBaseline } from "@material-ui/core";
// import { ThemeProvider } from "@material-ui/core/styles";
// import theme from "./theme";
import { Neo4jProvider, createDriver } from "use-neo4j";

const driver = createDriver(
  process.env.REACT_APP_NEO4J_DB,
  process.env.REACT_APP_NEO4J_URL,
  process.env.REACT_APP_NEO4J_PORT,
  process.env.REACT_APP_NEO4J_USERNAME,
  process.env.REACT_APP_NEO4J_PASSWORD
);

ReactDOM.render(
  <React.StrictMode>
    <Neo4jProvider driver={driver}>
      <App driver={driver} />
    </Neo4jProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
