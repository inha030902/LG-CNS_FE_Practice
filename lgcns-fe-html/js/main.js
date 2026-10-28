const counter = document.querySelector('.counter')
let count = 0
console.log(counter)

counter.addEventListener('click', () => {
  count += 1
  counter.textContent = `Count is ${count}`
})
