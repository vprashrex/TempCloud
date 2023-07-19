let selectedTime = 15 * 60 * 1000;

for (const button of document.getElementById("timeRadios").children){
	button.addEventListener("click", function (event){
		for (const sibling of this.parentElement.children){
			sibling.classList.remove("selected");
		}
		this.classList.add("selected");
		selectedTime = Number(this.getAttribute("data-val"));
	});
}

let uploader = document.createElement("input");
uploader.type = "file";
uploader.multiple = true;
uploader.id = "uploader";
document.getElementById("uploadBox").appendChild(uploader);

for (const event of ["drag", "dragstart", "dragend", "dragover", "dragenter", "dragleave", "drop"]){
	window.addEventListener(event, (event) => {
		event.preventDefault();
		event.stopPropagation();
	});
}

for (const event of ["dragover", "dragenter"]){
	window.addEventListener(event, (event) => {
		document.body.classList.add("lightened");
	});
}
for (const event of ["dragleave", "dragend", "drop"]){
	window.addEventListener(event, (event) => {
		document.body.classList.remove("lightened");
	});
}

window.addEventListener("drop", (event) => {
	for (const file of event.dataTransfer.files){
		addFileToQueue(file);
	}
});


document.getElementById("newGroup").addEventListener("click", function (event){
	lastCode = null;
	this.style.color = "#42ffff";
	setTimeout(() => {
		this.style.color = "#ffffff";
	}, 200);
});


document.getElementById("uploadBox").addEventListener("click", function (event){
	uploader.click();
});

uploader.addEventListener("input", function (event){
	event.preventDefault();

	for (let i = 0; i < this.files.length; i++){
		addFileToQueue(this.files[i]);
	}
});

var uploadQueue = [];
var lastCode = null;
var verificationTokens = {};

function submitFile(){
	const file = uploadQueue[0];

	document.getElementById("nowUploading").textContent = file.file.name;

	const xhr = new XMLHttpRequest();

	if (file.keepCode && lastCode !== null){
		xhr.open("POST", `/api/file-upload?expiration=${file.expiration}&code=${lastCode}&token=${verificationTokens[lastCode]}`, true);
	} else {
		xhr.open("POST", `/api/file-upload?expiration=${file.expiration}`, true);
	}

	const body = new FormData();
	body.append("file", file.file);

	function uploadFinished(res){
		document.getElementById("uploadProgressInner").style.width = "0%";
		document.getElementById("uploadProgressText").textContent = "Idle";
		document.getElementById("nowUploading").textContent = "Waiting for file...";

		addToCodes(res.filename, res.code);

		uploadQueue.shift();

		if (uploadQueue.length > 0){
			submitFile();
			document.getElementById("queueCount").textContent = (uploadQueue.length - 1).toString();
		}
	}

	xhr.upload.onprogress = function (event){
		const loadPercent = event.loaded / event.total * 100;
		document.getElementById("uploadProgressInner").style.width = `${loadPercent}%`;
		document.getElementById("uploadProgressText").textContent = `${sizeToString(event.loaded)} / ${sizeToString(event.total)} (${loadPercent.toFixed(1)}%)`;
	}

	xhr.onload = function (){
		if (this.status !== 200){
			return uploadFinished({
				filename: uploadQueue[0].file.name,
				code: "Error"
			});
		}

		const res = JSON.parse(xhr.responseText);

		if (file.keepCode){
			lastCode = res.code;
		}

		if (typeof res.verificationToken !== "undefined"){
			verificationTokens[res.code] = res.verificationToken;
		}

		uploadFinished(res);
	}

	xhr.onerror = function (){
		uploadFinished({
			filename: uploadQueue[0].file.name,
			code: "Error"
		});
	}

	xhr.send(body);
}

function addFileToQueue(file){
	if (file.size > 10737418240 && location.hostname != "192.168.0.104" && location.hostname != "10.6.0.1"){ //fancy thing to bypass 10GiB limit for an admin, if removed, the server will not allow the upload anyway
		addToCodes(file.name, "Too big");
		return;
	}

	uploadQueue.push({
		file: file,
		expiration: selectedTime,
		keepCode: document.getElementById("groupFilesCheckbox").getAttribute("checked") === "1" ? true : false
	});

	if (uploadQueue.length === 1){
		submitFile();
	}

	document.getElementById("queueCount").textContent = (uploadQueue.length - 1).toString();
}

var myCodes = {};

function addToCodes(filename, code){
	if (myCodes.hasOwnProperty(code) && code !== "Too big" && code !== "Error"){
		myCodes[code].push(filename);

		document.getElementById(`row-${code}`).firstElementChild.textContent = `Group (${myCodes[code].length} files)`;
	} else {
		myCodes[code] = [filename];

		const wrap = document.createElement("div");
		const nameDiv = document.createElement("div");
		const codeDiv = document.createElement("div");

		wrap.classList.add("wrapCell");
		nameDiv.classList.add("fileNameCell");
		codeDiv.classList.add("codeCell");

		nameDiv.textContent = filename;
		codeDiv.textContent = code;



		if (code === "Too big" || code === "Error"){
			wrap.classList.add("error");
		} else {
			wrap.id = `row-${code}`;
			wrap.addEventListener("click", codeRowClicked);
		}

		wrap.appendChild(nameDiv);
		wrap.appendChild(codeDiv);

		document.getElementById("table").prepend(wrap);
	}
}

var hideTimeout = 0;

function codeRowClicked(){
	const textarea = document.createElement("textarea");
	textarea.value = `https://temp.kotol.cloud/?c=${this.children[1].textContent}`;
	document.body.appendChild(textarea);
	textarea.select();
	document.execCommand("copy");
	document.body.removeChild(textarea);

	const copySuccess = document.getElementById("copySuccess");

	copySuccess.classList.add("shown", "up");

	clearTimeout(hideTimeout);

	hideTimeout = setTimeout(() => {
		copySuccess.classList.remove("shown");

		setTimeout(() => {
			copySuccess.classList.remove("up");
		}, 250);
	}, 2000);
}
