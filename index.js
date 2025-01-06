
function INIT() {
    nonav = 1;
    IPFS.onready = async function(){

	try { IPFS.type_cache = JSON.parse(f5_read('ipfs_type_cache')); } catch(er) {} // включим кэш
	IPFS.type_cache = IPFS.type_cache || {};

IPFS.type_cache = false;

        dom('work',`

<input type='button' value='Upload new file' onclick="UPLOAD.win()">
<input type='button' value='Set PGP Keys' onclick="UPLOAD.www_setpgp()">

		<p><div id='ipfs-my-list'></div>
		<div class='ll mv0 r' onclick='UPLOAD.www_addurl()'>add url</div>

		<p><div id='ipfs-list'><div class='ll' onclick='UPLOAD.relist()'>View all</div></div>
	`);
//	var o = await UPLOAD.relist();
	var o = await UPLOAD.relist_my();
    };
    IPFS.init();
}


UPLOAD = {

  View: async function(url, name) {
    try {
        // 1. Скачать файл
        const response = await fetch(url);
        if(!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const encryptedText = await response.text(); // Читаем содержимое как текст

	const name = ((encryptedText.match(/\# PGP name\:\s*(.+)/) || [])[1]?.trim()) || null;
	console.log('Extracted name:', name);

	// 3. Распаковать файл PGP
	const decryptedContent = await UPLOAD.decryptPGPFile(encryptedText);
	if(typeof(decryptedContent)=='string') return idie(h(decryptedContent));

        // 3. Создать Blob и ссылку для скачивания
        const blob = new Blob([decryptedContent], { type: 'application/octet-stream' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = name || 'decrypted_pgp_file';
        downloadLink.click();
    } catch (error) { console.error('Error in View:', error); }
  },

  // Функция для расшифровки PGP файла
  decryptPGPFile: async function(encryptedContent) {
   try {

    if(encryptedContent.indexOf('--BEGIN PGP MESSAGE--')<0) return 'Error: no PGP content';

    const privateKeyArmored = f5_read('pgp_private_key','');
    if(privateKeyArmored.indexOf('--BEGIN PGP PRIVATE KEY BLOCK--')<0) return 'Error: no public key';

    var passphrase = f5_read('pgp_password','');
    if(passphrase=='') passphrase = await UPLOAD.www_pgppassword();

    // '-----BEGIN PGP PRIVATE KEY BLOCK-----\n...'; // Ваш приватный ключ
    // const passphrase = '1'; // your_passphrase'; // Пароль для приватного ключа
    // Читаем приватный ключ
    const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
    await privateKey.decrypt(passphrase);
    // 2. Расшифровываем PGP-сообщение
    const encryptedMessage = await openpgp.message.readArmored(encryptedContent); // Для текстового формата
    const { data: decryptedContent } = await openpgp.decrypt({
        message: encryptedMessage,
        privateKeys: [privateKey],
        format: 'binary' // Указываем бинарный формат
    });
    // return decryptedContent;
    return new Uint8Array(decryptedContent); // Преобразуем данные в Uint8Array
   } catch(er) {
	return 'Error decoding: '+er;
   }
  },


  relist_my: async function(){ // upload file list
    dom('ipfs-my-list','');
	try { IPFS.myfiles = JSON.parse(f5_read('ipfs_myfiles')); } catch(er) {} // включим кэш
	IPFS.myfiles = IPFS.myfiles || [];
	dom('ipfs-my-list',mpers(`
<table border='0' cellpadding='2' cellspacing='0' id='ipfs-my-list-table'>
{for(myfiles):
<tr hash='{#hash}' content-type='{#type}'>
<td>{i}</td>
<td><i alt='Delete from my' onclick='UPLOAD.DelMy()' class='e_cancel1 mv'></i></td>
<td><i alt='Delete' onclick='IPFS.Del(this)' class='e_cancel mv'></i></td>
<td><a class='r' onclick='return IPFS.View(this)' href='`+IPFS.endpoint+`{#hash}'>{#hash}</a></td>
<td><div>{case(name):
{false:}
{*:{#name}}
}</div><div class='br'>{#type}</div></td>
<td class='r leng'>{#leng}</td>
<td class='br'><a href='https://ipfs.io/ipfs/{#hash}' target='_blank'>ipfs.io</a></td>
</tr>
}
</table>
`,{myfiles:IPFS.myfiles}));

  },

  DelMy: function(hash){
    hash = hash || IPFS.find_tr().getAttribute('hash');
    IPFS.myfiles = IPFS.myfiles.filter(item => item.hash !== hash);
    f5_save('ipfs_myfiles',JSON.stringify(IPFS.myfiles));
    UPLOAD.relist_my();
  },

  AddMy: function(hash){
    IPFS.Type(hash,function(hash,type,leng,name){
	IPFS.myfiles.push({hash:hash,type:type,leng:leng,name:name});
        f5_save('ipfs_myfiles',JSON.stringify(IPFS.myfiles));
        UPLOAD.relist_my();
    });
  },

  copytomy: function(){
    var hash=IPFS.find_tr().getAttribute('hash');
    if(dom('ipfs-my-list-table').querySelector("TR[hash='"+hash+"']")) return;
    UPLOAD.AddMy(hash);
  },

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
<td class='br'><a href='{#ipfsurl}' target='_blank'>ipfs.io</a></td>
<td class='br mv0' onclick='UPLOAD.copytomy()'>&#x2398;</td>
</tr>`
    });
  },


  www_setpgp: function(){

   return new Promise(function(resolve, reject) {

    ohelpc('setpgp','Set PGP keys',`
<style>
.pgp_public_key,.pgp_private_key { width:600px !important; height:100px; }
</style>
<p>PGP PUBLIC KEY:
<div><textarea class='pgp_public_key'>${f5_read('pgp_public_key')||''}</textarea></div>
<p>PGP PRIVATE KEY:
<div><textarea class='pgp_private_key'>${f5_read('pgp_private_key')||''}</textarea></div>
<p>PGP PASSWORD (optional): <input class='pgp_password' 4width='60' value='${f5_read('pgp_password')||''}'>
<div><input type='button' value='Save'></div>
`);

    var q=dom('setpgp');
    q.querySelector("input[type='button']").addEventListener('click', (event,x) => {
	    x='pgp_public_key'; f5_save(x,q.querySelector("textarea."+x).value);
	    x='pgp_private_key'; f5_save(x,q.querySelector("textarea."+x).value);
	    x='pgp_password'; f5_save(x,q.querySelector("input."+x).value);
	    clean(q);
            resolve(); // Если сервер возвращает JSON
    });

   });
  },


  www_pgppassword: function(){

   return new Promise(function(resolve, reject) {

    ohelpc('pgp_password','Input PGP password',`<input type='text' width='60' class='pgp_password'> <input type='button' value='GO'>`);

    var q=dom('pgp_password');
    q.querySelector("input[type='button']").addEventListener('click', (event,x) => {
	    clean(q);
            resolve(q.querySelector("input.pgp_password").value);
    });

   });
  },


  www_addurl: async function(){
    ohelpc('add_url','Add Url',`<input type='text' width='120' class='ipfs_url' placeholder='hash bafy12345... or url http://ipfs.io/...'> <input type='button' value='ADD'>`);
    var q=dom('add_url');
    q.querySelector("input[type='button']").addEventListener('click', (event,x) => {
	    var s = q.querySelector("input.ipfs_url").value; // 'https://ipfs.io/ipfs/bafkr4igsi2qphrykg2p5u5dimtdgn5cdglaid3xwf3uz5cylfdwgilxqhe';
	    // Регулярное выражение для поиска IPFS-хэша
	    var match = s.match(/\b(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-zA-Z0-9]{46,59})\b/);
	    var hash = match ? match[0] : null;
	    if(!hash) return salert('wrong hash',1000);
	    clean(q);
            UPLOAD.AddMy(hash);
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
//	    const encryptedContent = await UPLOAD.encryptBinaryFile(fileContent, pgp_public_key, 'file.name');


            // Шифруем содержимое файла
            const encryptedContent = `# PGP name: ${file.name}
# PGP time: ${new Date(file.lastModified).toLocaleString('en-GB',{timeZoneName:'short'}).replace(',','')}
# PGP date: ${new Date().toLocaleString('en-GB',{timeZoneName:'short'}).replace(',','')}
` + await UPLOAD.encryptBinaryFile(fileContent, pgp_public_key);

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

        UPLOAD.AddMy(o.Hash);

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
  encryptBinaryFile: async function(content, publicKeyArmored, comment) {
    // await openpgp.initWorker({ path: 'openpgp.worker.min.js' }); // Инициализация воркера - нахера?

    const publicKey = (await openpgp.key.readArmored(publicKeyArmored)).keys;

    // Преобразуем бинарный файл в Uint8Array
    const binaryMessage = new Uint8Array(content);

    const armor = true; // Включаем текстовую броню для сохранения бинарного формата
    // const armor = false; // Отключаем текстовую броню для сохранения бинарного формата

    // Шифруем бинарное содержимое
    const encrypted = await openpgp.encrypt({
        message: openpgp.message.fromBinary(binaryMessage), // Создаем сообщение из бинарных данных
        publicKeys: publicKey, // Публичный ключ
	armor: armor,
	// comment: 'LLLLLLL' // Ваш комментарий
    });

    return armor ? encrypted.data : encrypted.message.packets.write(); // Возвращаем зашифрованные бинарные данные
  },


save: function(file,opt){

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