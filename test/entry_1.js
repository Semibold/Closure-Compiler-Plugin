export default class App {
    constructor(props) {
        this.div = document.createElement("div");
        this.div.textContent = props.text;
        this.div.classList.add(...props.classNames);
    }

    render() {
        if (document.body.append) {
            document.body.append(this.div);
        } else {
            document.body.appendChild(this.div);
        }
        console.log("ok");
    }
}
