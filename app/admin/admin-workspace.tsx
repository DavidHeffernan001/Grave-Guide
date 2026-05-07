"use client";

import { RotateCcw, Save, SlidersHorizontal, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { prototypeBlocks, prototypeEntrances, prototypeRecords, type PrototypeBlock } from "@/lib/prototype-data";

const storageKey = "graveguide-admin-blocks-v1";

function cloneBlocks() {
  return prototypeBlocks.map((block) => ({ ...block }));
}

export function AdminWorkspace() {
  const [blocks, setBlocks] = useState<PrototypeBlock[]>(cloneBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState(prototypeBlocks[0]?.id ?? "A");
  const [status, setStatus] = useState("Unsaved local workspace");

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);

    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as PrototypeBlock[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setBlocks(parsed);
        setSelectedBlockId(parsed[0].id);
        setStatus("Loaded saved browser layout");
      }
    } catch {
      setStatus("Saved layout could not be loaded");
    }
  }, []);

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? blocks[0],
    [blocks, selectedBlockId]
  );

  function updateSelectedBlock(field: keyof Pick<PrototypeBlock, "x" | "y" | "width" | "height" | "rotate">, value: number) {
    setBlocks((currentBlocks) =>
      currentBlocks.map((block) => (block.id === selectedBlock.id ? { ...block, [field]: value } : block))
    );
    setStatus("Layout changed");
  }

  function saveLayout() {
    window.localStorage.setItem(storageKey, JSON.stringify(blocks));
    setStatus("Saved to this browser");
  }

  function resetLayout() {
    const defaults = cloneBlocks();
    setBlocks(defaults);
    setSelectedBlockId(defaults[0].id);
    window.localStorage.removeItem(storageKey);
    setStatus("Reset to prototype defaults");
  }

  function addBlock() {
    const nextLetter = String.fromCharCode(65 + blocks.length);
    const newBlock: PrototypeBlock = {
      id: nextLetter,
      name: `Block ${nextLetter}`,
      x: 58,
      y: 42,
      width: 20,
      height: 18,
      rotate: 39
    };

    setBlocks((currentBlocks) => [...currentBlocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setStatus(`Added ${newBlock.name}`);
  }

  function deleteSelectedBlock() {
    if (blocks.length <= 1) {
      setStatus("Keep at least one block");
      return;
    }

    const nextBlocks = blocks.filter((block) => block.id !== selectedBlock.id);
    setBlocks(nextBlocks);
    setSelectedBlockId(nextBlocks[0].id);
    setStatus(`Deleted ${selectedBlock.name}`);
  }

  return (
    <section className="admin-layout">
      <aside className="admin-sidebar">
        <h1>Sligo Town Cemetery</h1>
        <p>Configuration workspace rebuilt from the original prototype. Changes save locally for now.</p>
        <div className="admin-stat">
          <strong>{blocks.length}</strong>
          <span>Blocks</span>
        </div>
        <div className="admin-stat">
          <strong>{prototypeRecords.length}</strong>
          <span>Demo records</span>
        </div>
        <div className="admin-stat">
          <strong>{prototypeEntrances.length}</strong>
          <span>QR entrances</span>
        </div>
      </aside>

      <section className="admin-board">
        <div className="admin-toolbar">
          <button onClick={saveLayout} type="button">
            <Save size={16} aria-hidden="true" />
            Save layout
          </button>
          <button onClick={addBlock} type="button">
            <SlidersHorizontal size={16} aria-hidden="true" />
            Add block
          </button>
          <button onClick={resetLayout} type="button">
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
          <button onClick={deleteSelectedBlock} type="button">
            <Trash2 size={16} aria-hidden="true" />
            Delete selected
          </button>
          <span className="admin-save-status">{status}</span>
        </div>

        <div className="admin-workspace-grid">
          <div className="admin-map">
            <div className="phone-path main" />
            <div className="phone-path diagonal" />
            {blocks.map((block) => (
              <button
                className={block.id === selectedBlock.id ? "admin-block selected" : "admin-block"}
                key={block.id}
                onClick={() => setSelectedBlockId(block.id)}
                style={{
                  left: `${block.x - 25}%`,
                  top: `${block.y + 5}%`,
                  width: `${block.width}%`,
                  height: `${block.height}%`,
                  transform: `rotate(${block.rotate}deg)`
                }}
                type="button"
              >
                <strong>{block.name}</strong>
                <span>
                  {block.width} x {block.height} / {block.rotate}deg
                </span>
              </button>
            ))}
          </div>

          <aside className="block-editor">
            <h2>{selectedBlock.name}</h2>
            <p>Adjust the selected block overlay.</p>
            <label>
              X position
              <input
                max="110"
                min="0"
                onChange={(event) => updateSelectedBlock("x", Number(event.target.value))}
                type="range"
                value={selectedBlock.x}
              />
              <span>{selectedBlock.x.toFixed(1)}%</span>
            </label>
            <label>
              Y position
              <input
                max="100"
                min="0"
                onChange={(event) => updateSelectedBlock("y", Number(event.target.value))}
                type="range"
                value={selectedBlock.y}
              />
              <span>{selectedBlock.y.toFixed(1)}%</span>
            </label>
            <label>
              Width
              <input
                max="40"
                min="8"
                onChange={(event) => updateSelectedBlock("width", Number(event.target.value))}
                type="range"
                value={selectedBlock.width}
              />
              <span>{selectedBlock.width}%</span>
            </label>
            <label>
              Height
              <input
                max="42"
                min="8"
                onChange={(event) => updateSelectedBlock("height", Number(event.target.value))}
                type="range"
                value={selectedBlock.height}
              />
              <span>{selectedBlock.height}%</span>
            </label>
            <label>
              Rotation
              <input
                max="90"
                min="-90"
                onChange={(event) => updateSelectedBlock("rotate", Number(event.target.value))}
                type="range"
                value={selectedBlock.rotate}
              />
              <span>{selectedBlock.rotate}deg</span>
            </label>
          </aside>
        </div>

        <div className="admin-panels">
          {blocks.map((block) => (
            <button
              className={block.id === selectedBlock.id ? "admin-panel selected" : "admin-panel"}
              key={block.id}
              onClick={() => setSelectedBlockId(block.id)}
              type="button"
            >
              <span className="admin-panel-dot" />
              <div>
                <strong>{block.name}</strong>
                <span>
                  x {block.x.toFixed(1)} / y {block.y.toFixed(1)} / {block.rotate}deg
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
