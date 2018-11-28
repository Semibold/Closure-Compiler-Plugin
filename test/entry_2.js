import "./core.css";
import App from "./entry_1.js";

export const app = new App({
    text: "Hello world!",
    classNames: ["app-hello", "app-world"],
});

app.render();
