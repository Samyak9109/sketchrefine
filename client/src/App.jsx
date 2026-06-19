import { useState } from "react";
import Canvas from "./components/Canvas";
import ToolBar from "./components/ToolBar";

const createRoomId = () => crypto.randomUUID();

const getInitialRoomId = () => {
  const params = new URLSearchParams(window.location.search);
  const existingRoom = params.get("room");

  if (existingRoom) return existingRoom;

  const newRoom = createRoomId();
  window.history.replaceState(null, "", `?room=${encodeURIComponent(newRoom)}`);
  return newRoom;
};

const App = () => {
  const [roomId, setRoomId] = useState(getInitialRoomId);

  const changeRoom = (nextRoomId) => {
    const trimmedRoomId = nextRoomId.trim();
    if (!trimmedRoomId) return;

    window.history.pushState(
      null,
      "",
      `?room=${encodeURIComponent(trimmedRoomId)}`,
    );
    setRoomId(trimmedRoomId);
  };

  const createRoom = () => {
    changeRoom(createRoomId());
  };

  const leaveRoom = () => {
    changeRoom(createRoomId());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToolBar
        roomId={roomId}
        onCreateRoom={createRoom}
        onJoinRoom={changeRoom}
        onLeaveRoom={leaveRoom}
      />
      <Canvas key={roomId} roomId={roomId} />
    </div>
  );
};

export default App;
