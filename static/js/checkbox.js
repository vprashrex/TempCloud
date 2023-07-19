const checkboxes = document.getElementsByClassName("checkbox");

function clickListener(){
	if (this.getAttribute("checked") === "1"){
		this.setAttribute("checked", "0");
		this.firstElementChild.setAttribute("checked", "0");
	} else {
		this.setAttribute("checked", "1");
		this.firstElementChild.setAttribute("checked", "1");
	}
}

for (const checkbox of checkboxes){
	let innerWrap = document.createElement("div");
	innerWrap.classList.add("checkboxInnerWrap");

	let leftTick = document.createElement("div");
	leftTick.classList.add("checkboxLeftTick");
	let rightTick = document.createElement("div");
	leftTick.classList.add("checkboxRightTick");

	innerWrap.appendChild(leftTick);
	innerWrap.appendChild(rightTick);
	checkbox.appendChild(innerWrap);

	checkbox.setAttribute("checked", "0");
	innerWrap.setAttribute("checked", "0");
	checkbox.addEventListener("click", clickListener);
}