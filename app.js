
const roomInput=document.getElementById('roomInput');
const roomLabel=document.getElementById('roomLabel');
let room='';

const protocol=location.protocol==='https:'?'wss':'ws';
const ws=new WebSocket(`${protocol}://${location.host}`);

let localStream;
let pc;

const config={iceServers:[{urls:'stun:stun.l.google.com:19302'}]};

function createPeer(){
  pc=new RTCPeerConnection(config);

  localStream.getTracks().forEach(t=>pc.addTrack(t,localStream));

  pc.ontrack=e=>{
    document.getElementById('remoteVideo').srcObject=e.streams[0];
  };

  pc.onicecandidate=e=>{
    if(e.candidate){
      ws.send(JSON.stringify({
        room,type:'candidate',candidate:e.candidate
      }));
    }
  };
}

document.getElementById('joinBtn').onclick=()=>{
  room=roomInput.value.trim() || Math.random().toString(36).slice(2,8);
  const url=`${location.origin}/?room=${room}`;
  history.replaceState({},'',`?room=${room}`);
  roomLabel.innerText='Share: '+url;
};

const params=new URLSearchParams(location.search);
if(params.get('room')){
  room=params.get('room');
  roomInput.value=room;
  roomLabel.innerText='Room: '+room;
}

document.getElementById('cameraBtn').onclick=async()=>{
  localStream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  document.getElementById('localVideo').srcObject=localStream;
  createPeer();
};

document.getElementById('callBtn').onclick=async()=>{
  const offer=await pc.createOffer();
  await pc.setLocalDescription(offer);
  ws.send(JSON.stringify({room,type:'offer',offer}));
};

ws.onmessage=async(ev)=>{
  const data=JSON.parse(ev.data);

  if(data.type==='offer'){
    if(!pc) createPeer();
    await pc.setRemoteDescription(data.offer);
    const answer=await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.send(JSON.stringify({room,type:'answer',answer}));
  }

  if(data.type==='answer'){
    await pc.setRemoteDescription(data.answer);
  }

  if(data.type==='candidate'){
    try{await pc.addIceCandidate(data.candidate);}catch(e){}
  }
};
