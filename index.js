
function INIT() {
    nonav = 1;
    IPFS.onready = async function(){

	try { IPFS.type_cache = JSON.parse(f5_read('ipfs_type_cache')); } catch(er) {} // включим кэш
	IPFS.type_cache = IPFS.type_cache || {};

        dom('work',`

<input type='button' value='Upload new file' onclick="UPLOAD.win()">
<input type='button' value='Set PGP Keys' onclick="UPLOAD.www_setpgp()">

		<p><div id='ipfs-list'></div>
	`);
	var o = await UPLOAD.relist();
    };
    IPFS.init();
}


UPLOAD = {

  relist: async function(){ // upload file list
    dom('ipfs-list','');
    return await IPFS.List({
	    type:"exist",
	    table_template: "<table border='0' cellpadding='2' cellspacing='0' id='ipfs-list-table'>{table}</table>",
	    template: `<tr hash='{#hash}'>
<td>{i}</td>
<td><i alt='Delete' onclick='IPFS.Del(this)' class='e_cancel mv'></i></td>
<td><a class='r' onclick='return IPFS.View(this)' href='{#url}'>{#hash}</a></td>
<td><i class='e_help'></i></td>
<td class='r'></td>
<td class='r leng'></td>
<td class='br'><a href='{ipfsurl}' target='_blank'>ipfs.io</td>
</tr>`
    });
  },


  www_setpgp: function(){
    ohelpc('setpgp','Set PGP keys',`
<style>
.pgp_public_key,.pgp_private_key { width:600px !important; height:100px; }
</style>
<p>PGP PUBLIC KEY:
<div><textarea class='pgp_public_key'>${f5_read('pgp_public_key')||''}</textarea></div>
<p>PGP PRIVATE KEY:
<div><textarea class='pgp_private_key'>${f5_read('pgp_private_key')||''}</textarea></div>
<div><input type='button' value='Save'></div>
`);

    var q=dom('setpgp');
    q.querySelector("input[type='button']").addEventListener('click', (event,x) => {
	    x='pgp_public_key'; f5_save(x,q.querySelector("textarea."+x).value);
	    x='pgp_private_key'; f5_save(x,q.querySelector("textarea."+x).value);
	    clean(q);
    });

  },

  showhash: function(hash){
    var ee=false;
    dom("ipfs-list-table").querySelectorAll("TR[hash='"+hash+"']").forEach(e=>{ ee=e; e.style.backgroundColor='green';});
    if(ee) ee.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  // Обработка файлов
  file_ready: async function(files) {
	console.log('FILES:', files);
	console.log(files)
        var file = files[0];
        console.log('FILE:', file);

	const pgp_public_key = f5_read('pgp_public_key');
        if(pgp_public_key.indexOf('--BEGIN PGP PUBLIC KEY BLOCK--')>=0) {
	  // Если прописан ключ
          try {
	    // Читаем содержимое файла как ArrayBuffer
	    const fileContent = await UPLOAD.fileToArrayBuffer(file);
	    console.log('fileContent',fileContent);

	    // Шифруем содержимое файла
	    const encryptedContent = await UPLOAD.encryptBinaryFile(fileContent, pgp_public_key);
	    console.log('encryptedContent',encryptedContent);
	    // Замена объекта file
	    file = new File(
	        [encryptedContent], // Зашифрованное содержимое
	        file.name + '.pgp',     // Добавляем расширение для обозначения шифрования
	        { type: 'application/pgp-encrypted' } // Устанавливаем MIME-тип
	    );
	  } catch(er) {
    		console.error('Ошибка при шифровании файла:', er);
	  }
	}

	var o = await UPLOAD.save( file );
	console.log('o=',o);
	clean('upload');
	await UPLOAD.relist();
	UPLOAD.showhash(o.Hash); // Пометить новый файл зелененьким
  },


  // Функция для получения тела бинарного файла
  fileToArrayBuffer: function(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
  },

  // Функция шифрования бинарного файла
  encryptBinaryFile: async function(content, publicKeyArmored) {
    // await openpgp.initWorker({ path: 'openpgp.worker.min.js' }); // Инициализация воркера - нахера?

    const publicKey = (await openpgp.key.readArmored(publicKeyArmored)).keys;

    // Преобразуем бинарный файл в Uint8Array
    const binaryMessage = new Uint8Array(content);

    // Шифруем бинарное содержимое
    const encrypted = await openpgp.encrypt({
        message: openpgp.message.fromBinary(binaryMessage), // Создаем сообщение из бинарных данных
        publicKeys: publicKey, // Публичный ключ
        armor: false, // Отключаем текстовую броню для сохранения бинарного формата
    });

    return encrypted.message.packets.write(); // Возвращаем зашифрованные бинарные данные
  },


save: async function(file,opt){

    const formData = new FormData();
    formData.append('file', file); // 'file' — имя поля, ожидаемого сервером
    return new Promise(function(resolve, reject) {
	// Отправляем файл на сервер
	fetch(IPFS.endpointSave, { method: 'POST', body: formData })
        .then((response) => {
            if(!response.ok) throw new Error('Network response was not ok ' + response.statusText);
            resolve(response.json()); // Если сервер возвращает JSON
        })
        .then((data) => {
            console.log('File uploaded successfully:', data);
	    resolve(data);
        })
        .catch((error) => {
            console.error('Error uploading file:', error);
	    reject(error);
        });
    });
},

  win: function() {
	// ohelpc('upload','Upload new file',`<file-upload></file-upload>`);
	ohelpc('upload','Upload new file',`
	<style>
	    .filezone { border-radius: 8px; background-color: #f5f5f5; width: 448px; height: 160px; display: flex; align-items: center; justify-content: center; opacity: 0.8; }
	    .fileactive { background-color: #f5fff5 !important; opacity: 1.0 !important; }
	</style>

	<div class='filezone'>
            <img class="mv" src="img/download_2.svg" />
        </div>
        <input name="zone" style='display:none' type="file" accept="*/*" />
	`);

	const dropZone = dom('upload').querySelector(".filezone");
	const inputZone = dom('upload').querySelector("input");

	// При выборе файлов через диалог
        inputZone.addEventListener('change', (event) => {
	    console.log(event.type,event.target);
	    dropZone.classList.add('fileactive');
	    UPLOAD.file_ready( event.target.files );
        });

	// Событие dragover: предотвращаем стандартное поведение
        dropZone.addEventListener('dragover', (event) => {
	    event.preventDefault(); // Не даёт браузеру блокировать перетаскивание
            dropZone.classList.add('fileactive');
        });

	// Событие dragleave: возвращаем исходный стиль
        dropZone.addEventListener('dragleave', () => {
	    event.preventDefault();
	    dropZone.classList.remove('fileactive');
	});

	// Событие drop: получаем файлы
        dropZone.addEventListener('drop', (event) => {
	    event.preventDefault(); // Предотвращаем стандартное поведение браузера
	    dropZone.classList.add('fileactive');

	    const files = event.dataTransfer.files;
	    if (files.length > 0) {
    		console.log('Dropped files:', files);
	        UPLOAD.file_ready(files);
	    } else {
    		console.warn('No files were dropped!');
	    }

	});

        dropZone.addEventListener('click', (event) => {
	    console.log(event.type,event.target);
	    inputZone.click();
	});
  }



}