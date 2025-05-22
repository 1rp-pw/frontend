"use client";
import {
	EdgeLabelRenderer,
	type EdgeProps,
	getSmoothStepPath,
} from "reactflow";

export function CustomEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	data,
	style = {},
	markerEnd,
}: EdgeProps) {
	const [edgePath, labelX, labelY] = getSmoothStepPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	return (
		<>
			<path
				id={id}
				style={{
					...style,
					strokeWidth: 2,
					stroke: data?.condition === "true" ? "#10b981" : "#ef4444",
				}}
				className="react-flow__edge-path"
				d={edgePath}
				markerEnd={markerEnd}
			/>
			<EdgeLabelRenderer>
				<div
					style={{
						position: "absolute",
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
						pointerEvents: "all",
					}}
					className={`rounded-md border px-2 py-1 font-bold text-xs shadow-sm ${
						data?.condition === "true"
							? "border-green-300 bg-green-100 text-green-800"
							: "border-red-300 bg-red-100 text-red-800"
					}`}
				>
					{data?.condition || ""}
				</div>
			</EdgeLabelRenderer>
		</>
	);
}
