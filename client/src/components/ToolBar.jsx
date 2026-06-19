import { useDispatch, useSelector } from "react-redux";
import { setColor, setWidth } from "../redux/slices/toolSlice.js";

const ToolBar = () => {
  const dispatch = useDispatch();
  const color = useSelector((state) => state.tools.color);
  const width = useSelector((state) => state.tools.width);

  return (
    <div className="flex items-center gap-4 p-2">
      <input
        type="color"
        value={color}
        onChange={(e) => dispatch(setColor(e.target.value))}
      />
      <input
        type="range"
        min="1"
        max="20"
        value={width}
        onChange={(e) => dispatch(setWidth(Number(e.target.value)))}
      />
      <span>{width}px</span>
    </div>
  );
};

export default ToolBar;
