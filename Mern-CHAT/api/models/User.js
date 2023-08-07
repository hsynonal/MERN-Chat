const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username: {type: String, unique: true},
    password: String,
}, {timestamps: true})

//const UserModel:UserModel adında bir değişken oluşturur.Bu değişken, Mongoose tarafından oluşturulacak ve MongoDB veritabanındaki "User" koleksiyonunu temsil edecek bir modeli tutar.
const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
