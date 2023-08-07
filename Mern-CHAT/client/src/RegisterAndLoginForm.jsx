import { useContext, useState } from "react";
import axios from 'axios';
import { UserContext } from "./UserContext.jsx";



export default function RegisterAndLoginForm() { 
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoginOrRegister, setIsLoginOrRegister] =useState("register");
    const {setUsername:setLoggedInUsername, setId} = useContext(UserContext);//setUsername özelliğini setLoggedInUsername olarak yeniden adlandırır. Böylece, bu özelliğe artık setLoggedInUsername üzerinden erişilebilir
    async function handleSubmit(ev) {
        ev.preventDefault();
        const url = isLoginOrRegister === 'register'?'register':'login'
        const {data} = await axios.post(url , {username, password});
        setLoggedInUsername(username);
        setId(data.id)
    }
    return (
        <div className="bg-blue-50 h-screen flex items-center ">
            <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
                <input value={username}//input alanı username değişkeninin değerini yansıtacaktır. 
                       onChange={ev => setUsername(ev.target.value)}//setUsername fonksiyonunu kullanarak "username" değişkenine yeni değeri atar.
                       type="text" placeholder="kullanıcıadı" className="block w-full rounden-sm p-2 mb-2 border" />
                <input value={password}//input alanı password değişkeninin değerini yansıtacaktır. 
                       onChange={ev => setPassword(ev.target.value)} 
                       type="password" placeholder="şifre" className="block w-full rounden-sm p-2 mb-2 border"/>
                <button className="bg-blue-500 text-white block w-full rounden-sm p-2 cursor-pointer">
                    {isLoginOrRegister ==='register' ? 'Kayıt Ol':'Giriş Yap'}
                </button>
                <div className="text-left mt-2 ">
                    {isLoginOrRegister === 'register' && (
                        <div>
                            Zaten bir hesabınız var mı? 
                            <button className="ml-1" onClick={()=>setIsLoginOrRegister('login')}> 
                                Giriş Yapın
                            </button>
                        </div>
                    )}
                    {isLoginOrRegister === 'login' && (
                        <div>
                        Hesabınız yok mu? 
                        <button onClick={()=>setIsLoginOrRegister('register')}> 
                            Kayıt Ol
                        </button>
                    </div>
                    )}
                </div>
            </form>
        </div>
    )
}
