const elements = [
	document.getElementById("title"),
	document.getElementById("tutorial"),
	document.getElementById("upDown")
];

document.getElementById("title").desiredScale = 0.9;
document.getElementById("tutorial").desiredScale = 0.9;
document.getElementById("upDown").desiredScale = 0.95;

function handleScale(){
	for (const element of elements){
		const scale = document.body.clientWidth * element.desiredScale / element.clientWidth;
		element.style.transform = `scale(${scale > 1 ? 1 : scale})`;
	}
}

window.addEventListener("resize", handleScale);
window.addEventListener("load", handleScale);