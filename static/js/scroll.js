function opacityControl(){
	const opacity = 1 - (window.scrollY / 300);
	const container = document.getElementById("arrowContainer");

	if (opacity <= 0){
		container.style.opacity = 0;
		container.style.pointerEvents = "none";
	} else {
		container.style.opacity = opacity;
		container.style.pointerEvents = "initial";
	}
}

window.addEventListener("scroll", opacityControl);
window.addEventListener("load", opacityControl);

let startTime, startScroll;

document.getElementById("arrowContainer").addEventListener("click", () => {
	startTime = Date.now();
	startScroll = window.scrollY;
	requestAnimationFrame(executeScroll);
});

function executeScroll(){
	const timeDiff = Date.now() - startTime;
	const targetScroll = Math.min(window.innerHeight, document.body.getBoundingClientRect().height - window.innerHeight);
	if (timeDiff < 450){
		const newScroll = Math.pow((timeDiff / 450), 1.6) * (targetScroll - startScroll) + startScroll;
		window.scrollTo(0, newScroll);
		requestAnimationFrame(executeScroll);
	} else {
		window.scrollTo(0, targetScroll);
	}
}

window.addEventListener("load", () => {
	const container = document.getElementById("arrowContainer");
	container.style.display = "none";

	setTimeout(() => {
		container.style.display = "";
	}, 0);
});
