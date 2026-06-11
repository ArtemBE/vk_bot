const {Keyboard} = require('vk-io');
function num(c, n){
    if(c<=n) return String(c)
    else return " ";
}
function com(c, n){
    if(c<=n) return "selectItem"
    else return "nothing";
}
function digitsKeyboard(n=10){
    const kb = Keyboard.builder()
    .textButton({label: num(1, n), payload: {command: com(1, n), item: 1}})
    .textButton({label: num(2, n), payload: {command: com(2, n), item: 2}})
    .textButton({label: num(3, n), payload: {command: com(3, n), item: 3}})
    .row()
    .textButton({label: num(4, n), payload: {command: com(4, n), item: 4}})
    .textButton({label: num(5, n), payload: {command: com(5, n), item: 5}})
    .textButton({label: num(6, n), payload: {command: com(6, n), item: 6}})
    .row()
    .textButton({label: num(7, n), payload: {command: com(7, n), item: 7}})
    .textButton({label: num(8, n), payload: {command: com(8, n), item: 8}})
    .textButton({label: num(9, n), payload: {command: com(9, n), item: 9}})
    .row()
    .textButton({label: "←", payload: {command: "arrowBack"}})
    .textButton({label: num(10, n), payload: {command: com(10, n), item: 10}})
    .textButton({label: "→", payload: {command: "arrowNext"}})
    .row()
    return n==0?Keyboard.builder():kb;
}
module.exports = {digitsKeyboard}