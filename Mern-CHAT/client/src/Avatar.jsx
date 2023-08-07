export default function Avatar({userId, username, online}) {
    if (!username || !userId) { 
        return null;//prop'larının boş veya tanımsız olup olmadığını kontrol eden ekstra bir güvenlik kontrolü
      }
    const colors = ['bg-teal-200','bg-red-200',
                    'bg-blue-200','bg-yellow-200',
                    'bg-green-200','bg-purple-200',]
    const userIdBase10 = parseInt(userId, 16);
    const colorIndex = userIdBase10 % colors.length;
    const color = colors[colorIndex]       
    return(
        <div className={"w-9 h-9 relative rounded-full flex items-center " +color}>
            <div className="text-center w-full">{username[0]}</div>
            {online && (
                <div className="absolute w-3 h-3 bg-green-400 bottom-0 right-0 rounded-full border border-white"></div>
            )}
            {!online && (
                <div className="absolute w-3 h-3 bg-gray-400 bottom-0 right-0 rounded-full border border-white"></div>
            )}
        </div>
    )
}