const allowedCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

let enteredCharacters = 0;

let expiresIn = 0, lastUpdate = 0;

for (const letter of document.getElementById("codeInput").children){
	let beforeInputValue = "";

	letter.addEventListener("beforeinput", function (){
		beforeInputValue = this.value;
	});

	letter.addEventListener("input", function (event){
		if (this.value !== "" && allowedCharacters.includes(this.value)){
			this.value = this.value.toUpperCase();
			this.classList.add("filled");
			enteredCharacters++;

			if (this.nextElementSibling === null){
				let code = "";
				for (const sibling of this.parentElement.children){
					code += sibling.value;
				}

				loadFileInfo(code);
			} else {
				this.nextElementSibling.focus();
			}
		} else if (enteredCharacters === 4 && beforeInputValue.length === 1 && this.value === ""){
			clearFileInfo();
			this.classList.remove("filled");
		} else {
			this.value = "";
		}
	});

	letter.addEventListener("keydown", function (event){
		if (event.code === "Backspace" || event.code === "Delete" || event.keyCode === 8){
			if (this.value !== ""){
				enteredCharacters--;
				this.value = "";
				this.classList.remove("filled");
			} else {
				if (this.previousElementSibling !== null){
					enteredCharacters--
					this.previousElementSibling.value = "";
					this.previousElementSibling.classList.remove("filled");
					this.previousElementSibling.focus();
				}
			}

			for (const letter of document.getElementById("codeInput").children){
				this.classList.remove("wrong");
			}
			document.getElementById("downloadButton").classList.add("disabled");

			if (enteredCharacters === 3){
				clearFileInfo();
			}
		}
	});

	letter.addEventListener("focus", function (event){
		if (enteredCharacters === 4){
			document.getElementById("codeInput").children[3].focus();
		} else {
			const shouldBeFocused = document.getElementById("codeInput").children[enteredCharacters];
			if (shouldBeFocused !== this){
				shouldBeFocused.focus();
			}
		}
	});
}

function setError(message){
	if (message == "") {
		document.getElementById("error-box").classList.remove("shown");
	}
	else{
		document.getElementById("error-box").classList.add("shown","up")
		var error_txt = document.getElementById("error-txt");
		error_txt.textContent = message;
	}
	
}

function loadFileInfo(code){
	const xhr = new XMLHttpRequest();
	xhr.timeout = 12 * 60 * 60 * 1000;

	xhr.open("POST", `/api/fileinfo/?code=${code}`,true);

	xhr.onload = function (event){
		const res = JSON.parse(this.responseText);

		if (this.status === 200){
			let downloadFilename = "";

			if (res.length === 1){
				document.getElementById("fileNameContent").textContent = res.filename;
				document.getElementById("fileSizeContent").textContent = sizeToString(res.size);
				downloadFilename = res.filename;
			} else {
				document.getElementById("fileNameContent").textContent = `${res.length} files (grouped)`;
				let totalSize = 0
				for (const size of res.size){
					totalSize += size
				}
				/* let size = 0;
				for (const size of res.size){
					size += res.size;
				} */
				document.getElementById("fileSizeContent").textContent = sizeToString(totalSize);

				downloadFilename = `Tempcloud_${res.code}.zip`;
			}


			const downloadButton = document.getElementById("downloadButton");
			downloadButton.href = `/api/download/${encodeURIComponent(downloadFilename)}?code=${res.code}`;
			downloadButton.download = downloadFilename;
			downloadButton.classList.remove("disabled");

			expiresIn = res.expiration;

			lastUpdate = Date.now();
			timeUpdateLoop();
		} else {
			setError(res.error);
			setTimeout(function(){
				setError("");
			},3000)
			for (const letter of document.getElementById("codeInput").children){
				letter.classList.add("wrong");
			}
		}
	}

	xhr.send();
}

var timeUpdateTimeout;

function timeUpdateLoop(){
	expiresIn -= Date.now() - lastUpdate;
	lastUpdate = Date.now();

	if (expiresIn < 0){
		return clearCode();
	}

	const seconds = Math.floor((expiresIn % (60 * 1000)) / 1000);
	const minutes = Math.floor((expiresIn % (60 * 60 * 1000)) / (60 * 1000));
	const hours = Math.floor((expiresIn / (60 * 60 * 1000)));

	document.getElementById("fileExpiresInContent").textContent = `${hours} ${hours === 1 ? "hour" : "hours"}, ${minutes} ${minutes === 1 ? "minute" : "minutes"}, ${seconds} ${seconds === 1 ? "second" : "seconds"}`;

	timeUpdateTimeout = setTimeout(timeUpdateLoop, 1000);
}

window.addEventListener("load", function(){
	if (location.search.startsWith("?")){
		const query = location.search.substring(1, location.search.length);
		const split = query.split("&");

		const queryObject = {};

		for (const parameter of split){
			const subsplit = parameter.split("=");
			const key = subsplit[0];
			const value = subsplit[1];
			queryObject[key] = value;
		}

		const code = queryObject.c;
		if (typeof code !== "string") return;
		if (code.length !== 4) return;

		for (var i = 0; i < 4; i++){
			if (!allowedCharacters.includes(code.charAt(i))) return;
		}

		const codeInput = document.getElementById("codeInput");
		for (var i = 0; i < 4; i++){
			codeInput.children[i].value = code.charAt(i).toUpperCase();
			codeInput.children[i].classList.add("filled");
		}

		enteredCharacters = 4;

		loadFileInfo(code.toUpperCase());

		history.replaceState(null, document.title, `${location.protocol}//${location.host}`);
	}
});

function clearCode(){
	const codeInput = document.getElementById("codeInput");

	for (var i = 0; i < 4; i++){
		codeInput.children[i].value = "";
		codeInput.children[i].classList.remove("filled", "wrong");
		codeInput.children[i].blur();
	}

	clearFileInfo();

	enteredCharacters = 0;
}

function clearFileInfo(){
	document.getElementById("fileNameContent").textContent = "";
	document.getElementById("fileSizeContent").textContent = "";
	document.getElementById("fileExpiresInContent").textContent = "";

	document.getElementById("downloadButton").classList.add("disabled");

	clearTimeout(timeUpdateTimeout);

	for (const letter of document.getElementById("codeInput").children){
		letter.classList.remove("wrong");
	}
}

function sizeToString(size){
	let text;
	if (size < 1024){
		text = `${size} B`;
	} else if (size < 1024 * 1024){
		text = `${(size / 1024).toFixed(1)} kiB`;
	} else if (size < 1024 * 1024 * 1024){
		text = `${(size / 1024 / 1024).toFixed(1)} MiB`;
	} else if (size < 1024 * 1024 * 1024 * 1024){
		text = `${(size / 1024 / 1024 / 1024).toFixed(1)} GiB`;
	} else {
		text = `${(size / 1024 / 1024 / 1024 / 1024).toFixed(1)} TiB`;
	}
	return text;
}
