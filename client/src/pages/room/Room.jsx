import React, { useCallback, useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import ReactPlayer from 'react-player'
import { useSocket } from '../../context/SocketProvider'
import peer from '../../services/PeerServices'
const Room = () => {
    const data = useLocation()
    const [remoteSockerId, setRemoteSocketId] = useState(null)
    const [myStream, setMyStream] = useState(null)
    const [remoteStream, setRemoteStream] = useState();
    console.log("objects", data.pathname)
    const socket = useSocket()
    const handleRoomJoined = useCallback((data) => {
        console.log("Data from joined Room", data)
        setRemoteSocketId(data?.id)
    }, [])


    const handleTrack = useCallback(async (ev) => {
        const remoteStream = ev.streams;
        console.log("GOT TRACKS!!");
        setRemoteStream(remoteStream[0]);    
    }, [remoteStream])

    useEffect(() => {
        peer.peer.addEventListener("track", handleTrack);
        return () => peer.peer.removeEventListener("track", handleTrack)
    }, [handleTrack]);

    const handleIncomingCall = useCallback(async (data) => {
        const { from, offer } = data
        setRemoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        setMyStream(stream);
        console.log(`Incoming Call`, from, offer);
        const ans = await peer.getAnswer(offer);
        socket.emit("call:accepted", { to: from, ans });
    }, [socket])

    const sendStreams = useCallback(() => {
        const senders = peer.peer.getSenders(); // Get the current senders
        myStream.getTracks().forEach(track => {
            const senderExists = senders.find(sender => sender.track === track);
            if (!senderExists) {
                peer.peer.addTrack(track, myStream); // Only add if the track isn't already added
            }
        });
    }, [myStream]);


    const handleCallAccepted = useCallback(
        async ({ from, ans }) => {
            await peer.setLocalDescription(ans);
            console.log("Call Accepted!");
            sendStreams();
        },
        [sendStreams]
    );

    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit("peer:nego:needed", { offer, to: remoteSockerId });
    }, [remoteSockerId, socket]);

    useEffect(() => {
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
        return () => {
            peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
        };
    }, [handleNegoNeeded]);
    const handleNegoNeedFinal = useCallback(async ({ ans }) => {
        await peer.setLocalDescription(ans);
    }, []);

    const handleNegoNeedIncomming = useCallback(
        async ({ from, offer }) => {
            const ans = await peer.getAnswer(offer);
            socket.emit("peer:nego:done", { to: from, ans });
        },
        [socket]
    );
    useEffect(() => {
        socket.on("room:joined", handleRoomJoined)
        socket.on("incoming:call", handleIncomingCall)
        socket.on("call:accepted", handleCallAccepted);
        socket.on("peer:nego:needed", handleNegoNeedIncomming);
        socket.on("peer:nego:final", handleNegoNeedFinal);
        return () => {
            socket.off("room:joined", handleRoomJoined)
            socket.off("incoming:call", handleIncomingCall)
            socket.off("call:accepted", handleCallAccepted);
            socket.off("peer:nego:needed", handleNegoNeedIncomming);
            socket.off("peer:nego:final", handleNegoNeedFinal);
        }
    }, [socket, handleRoomJoined, handleIncomingCall, handleCallAccepted, handleNegoNeedIncomming, handleNegoNeedFinal])

    const handleCall = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        if (stream) {
            const offer = await peer.getOffer()
            socket.emit("user:call", { to: remoteSockerId, offer })
            setMyStream(stream)
        }
    }, [remoteSockerId, socket])
    return (
        <div>
            Welcome to the Room

            <h2>{remoteSockerId ? "Connected" : "No one in room"}</h2>
            {myStream && <button onClick={sendStreams}>Send Stream</button>}

            {remoteSockerId && <button onClick={handleCall}>Call</button>}

            {myStream && <ReactPlayer url={myStream} playing muted />}
            {remoteStream && (
                <>
                    <h1>Remote Stream</h1>
                    <ReactPlayer
                        playing
                        muted
                        height="100px"
                        width="200px"
                        url={remoteStream}
                    />
                </>
            )}
        </div>
    )
}

export default Room