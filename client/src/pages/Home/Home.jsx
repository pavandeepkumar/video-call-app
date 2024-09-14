import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from './../../context/SocketProvider';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [email, setEmail] = useState('')
    const [roomId, setRoomId] = useState('')
    const navigate = useNavigate()

    const handleEmailChange = (e) => {
        setEmail(e.target.value)
    }
    const handleRoomIdChange = (e) => {
        setRoomId(e.target.value)
    }

    const socket = useSocket()
    console.log("scoket", socket)
    const handleFormSubmit = useCallback((e) => {
        e.preventDefault()

        socket.emit('room:join', { roomId, email })

    }, [email, roomId, socket])

    const handleRoomDataChange = useCallback((data) => {
        const { roomId, email } = data
        navigate(`/room/${roomId}`)
        console.log("data", data)
    } , [roomId])
    useEffect(() => {
        socket.on("room:join", handleRoomDataChange)
        return () => { socket.off("room:join", handleRoomDataChange) }
    }, [socket])
    return (
        <div className='login_container'>
            <form onSubmit={handleFormSubmit}>
                <label >Email Id</label>
                <input type="email" name='email' value={email} onChange={handleEmailChange} />
                <br /><br />
                <label htmlFor='roomId' >Room Id</label>
                <input type="text" name='roomId' value={roomId} onChange={handleRoomIdChange} />

                <button type='submit'>Join</button>
            </form>
        </div>
    )
}

export default Home