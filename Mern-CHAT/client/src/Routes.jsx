//Kullanıcının oturum durumuna göre farklı içerikleri render etmek için kullanılır. Eğer kullanıcı giriş yapmışsa, "logged in" metni görüntülenir; aksi takdirde kullanıcıyı kayıt olma formuyla karşılaştırır ve kullanıcıyı kayıt olmaya yönlendirir.
import { useContext } from "react";
import RegisterAndLoginForm from "./RegisterAndLoginForm.jsx";
import { UserContext } from "./UserContext";
import Chat from "./Chat.jsx";

export default function Routes() {
    const {username, id} = useContext(UserContext)

    if (username) {
        return <Chat/>
    }

    return (
        <RegisterAndLoginForm/>
    )
}