const express = require('express');//Node.js tabanlı web uygulamaları ve API'leri oluşturmak için kullanılan,HTTP isteklerini yönetmek, yönlendirmek ve yanıtlamak için kullanılır. 
const dotenv = require('dotenv');//.env dosyasından çevre değişkenlerini yüklemeye yarayan bir kütüphanedir.(URL)
const mongoose = require('mongoose');//MongoDB veritabanıyla iletişim kurmak ve veritabanı işlemlerini gerçekleştirmek için kullanılır.
const jwt = require('jsonwebtoken');//JWT, kullanıcı kimlik bilgilerini güvenli bir şekilde taşımak ve doğrulamak için kullanılan bir yöntemdir.
const cors = require('cors');//CORS, farklı kaynaklardan gelen web isteklerinin paylaşımını yönetir ve güvenlik önlemleri alır.
const bcrypt = require('bcryptjs');// Şifreleri güvenli bir şekilde karmaşıklaştırmak ve karşılaştırmak için kullanılır.
const cookieParser = require('cookie-parser');//Express.js uygulamasında çerezleri (cookie'leri) işlemek için kullanılan bir orta yazılımdır.
const User = require('./models/User');
const Message = require('./models/Message')
const ws = require('ws');
const { data } = require('autoprefixer');
const fs = require('fs')


dotenv.config();
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URL,(err) => {
    if (err) throw err;
});
const jwtSecret = process.env.JWT_SECRET
const bcryptSalt = bcrypt.genSaltSync(10)


const app = express();
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    credentials: true, //istemcinin (tarayıcının) çerezleri (cookie) göndermesine izin verilmesi gerektiğini belirtir.
    origin: process.env.CLIENT_URL,
}))

async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
          jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) throw err;
            resolve(userData)
          });
        }else {
            reject('no token');
        }
    })
}


app.get('/test', (req, res) => {
    res.json('test')
});

app.get('/messages/:userId', async (req, res) => {
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req)
    const ourUserId = userData.userId
    const messages = await Message.find({
        sender:{$in:[userId, ourUserId]},
        recipient: {$in:[userId, ourUserId]},
    }).sort({createdAt: 1});
    res.json(messages);
});

app.get('/people', async (req, res) => {
    const users =await User.find({}, {'_id':1,username:1})
    res.json(users)
})


app.get('/profile', (req, res) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        res.json(userData);
      });
    }else {
        res.status(401).json('no token');
    }
  });

app.post('/login', async (req, res) => {
    const {username, password} = req.body;
    const foundUser = await User.findOne({username})
    if (foundUser) {
        const passOk = bcrypt.compareSync(password, foundUser.password)
        if (passOk) {
            jwt.sign({ userId: foundUser._id, username }, jwtSecret, {}, (_err,token)=> {
                res.cookie('token',token, {sameSite:'none', secure:true}).json({
                    id: foundUser._id
                })
            })

        }
    }
});

app.post('/logout', (req, res) => {
    res.cookie('token', '', {sameSite:'none', secure:true}).json('ok')
})

//app.post('/register', (req, res) => {=Bu satır, Express.js uygulamasında "/register" yoluna gönderilen POST isteğini yakalar
//const {username, password} = req.body=Gelen istekteki(body ile) verileri bu değişkenlerde depolamış oluruz. Bu veriler genellikle bir kullanıcının kayıt olma formunda doldurduğu bilgilerdir.
//const createdUser = await User.create({username, password})=User modelini kullanarak veritabanında yeni kullanıcı oluşturur  ve "createdUser" değişkenine atar.
//jwt.sign({userId:createdUser._id}, jwtSecret).then((err, token) =>Oluşturulan kullanıcının  kimliği ile bir JWT oluşturulur.
//if (err) throw err;: Eğer JWT oluşturma sırasında bir hata oluşursa (örneğin, jwtSecret yanlış verilmişse), bu satır hata fırlatır ve kodu durdurur.
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
        const createdUser = await User.create({ username:username, password:hashedPassword,});
        jwt.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json({
                id: createdUser._id,
            });
        });
    } catch (err) {
        if (err) throw err;
        res.status(500).json("error");
    }
});



const server = app.listen(4040);
const wss = new ws.WebSocketServer({server})
wss.on('connection', (connection, req)=> {

    function notifyAboutOnlinePeople() {
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify({
                online: [...wss.clients].map(c=>({userId:c.userId, username:c.username})),
            }));
        })
    }


    connection.isAlive = true

    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer)
            connection.terminate()
            notifyAboutOnlinePeople()
            console.log('dead');
        }, 1000)
    }, 5000);
    

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
        connection.isAlive = true;
        // Bağlantının canlı olduğunu onaylamak için bir pong mesajı gönderin
        connection.send(JSON.stringify({ type: 'pong' }));
    });

    connection.on('close', () => {
        // Gerekirse zamanlayıcıları temizleyin ve diğer düzenlemeleri yapın
        clearTimeout(connection.deathTimer);
        clearInterval(connection.timer);
        
        // Bağlantıyı çevrimdışı kullanıcılar listesinden kaldırın ve diğer istemcilere bildirim gönderin
        notifyAboutOnlinePeople();
      });
      

//Bu bağlantı için kullanıcı adını ve kimliği cookieden okuyun
    const cookies = req.headers.cookie;
    if (cookies) {
        const tokenCookieString = cookies.split(';').find(str=>str.startsWith('token='));
        if (tokenCookieString){
            const token = tokenCookieString.split('=')[1];
            if (token) {
                jwt.verify(token, jwtSecret, {}, (err,userData)=> {
                    if (err) throw err;
                    const {userId, username} = userData
                    connection.userId = userId;
                    connection.username = username;
                })
            }
        }
    }




    connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString())
        const { recipient, text, file} = messageData
        let filename = null;
        if (file) {
            const parts = file.name.split('.');
            const ext = parts[parts.length - 1];
            filename = Date.now() + '.'+ext;
            const path  = __dirname + '/uploads/' + filename;
            const bufferData = new Buffer(file.data.split(',')[1], 'base64') 
            fs.writeFile(path, bufferData, () => {
                console.log('dosya kaydedildi:'+ path);
            })
        }
        if (recipient && (text || file)) {
            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient,
                text,
                file:file ? filename : null,
            });
            //alıcı kısım
            [...wss.clients]
                .filter(c => c.userId === recipient)
                .forEach(c => c.send(JSON.stringify({
                    text, 
                    sender: connection.userId,
                    recipient,
                    file: file ? filename : null,
                    _id: messageDoc._id,
                })));
        }
    });
    
    


    //Herkesi çevrimiçi kişiler hakkında bilgilendirin (birisi bağlandığında)
    notifyAboutOnlinePeople();
});

