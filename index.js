const express = require('express');
const fileupload = require('express-fileupload');
const fs = require('fs');
const PORT = process.env.PORT || 8000;
const API_KEY = process.env.API_KEY || "";
const cloudconvert = new (require('cloudconvert'))(API_KEY);

const app = express();

app.use(fileupload());
app.use(express.static('static/'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/view/index.html');
});

app.get('/*', (req, res) => {
    res.redirect('/');
});

app.post('/upload', async (req, res) => {
    if (!req.files || !req.files.document) {
        res.status(500).sendFile(__dirname + '/view/error.html');
        return;
    }
    const uid = (new Date()).getTime() + "-" + Math.round(Math.random() * 1000);
    let tempFile = `${__dirname}/${uid}`;

    try {
        const file = req.files.document;
        if (file.mimetype === 'application/pdf') {
            tempFile += '.pdf';
        } else {
            tempFile += '.docx';
        }

        await new Promise((resolve) => {
            file.mv(tempFile, (err) => {
                if (err) {
                    throw err;
                }
                resolve();
            });
        });

        const data = fs.readFileSync(tempFile).toString();
        let converter, content = '';
        console.log(file.mimetype);
        res.contentType('html');

        switch (file.mimetype) {
            case 'application/pdf':
                await new Promise((resolve) => {
                    fs.createReadStream(tempFile).pipe(
                        cloudconvert.convert({
                            inputformat: 'pdf',
                            outputformat: 'html',
                            input: 'upload',
                        })
                    )
                        .pipe(res).on('finish', () => {
                            resolve();
                        });
                });

                break;

            case 'application/msword': // doc
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // docx
                await new Promise((resolve) => {
                    fs.createReadStream(tempFile).pipe(
                        cloudconvert.convert({
                            inputformat: 'docx',
                            outputformat: 'html',
                            input: 'upload',
                        })
                    )
                        .pipe(res).on('finish', () => {
                            resolve();
                        });
                });
                break;

            default:
                res.status(500).sendFile(__dirname + '/view/error.html');
                break;
        }

        fs.unlinkSync(tempFile);
        if (content) console.log(content.length);
    } catch (err) {
        return res.send(err + '');
    }
});

app.listen(PORT, () => {
    console.log("Server listen at port " + PORT);
});

app.on('error', (err) => {
    console.log("ERROR: " + err);
})

process.on('uncaughtException', (err) => {
    console.error(err);
});

process.on('uncaughtException', (err) => {
    console.error(err);
});
