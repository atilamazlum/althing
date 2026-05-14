// React → Phaser köprüsü. Sahne ile state senkronize tutuluyor.

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import CourtroomScene from './CourtroomScene.js';

const SCENE_WIDTH = 1000;
const SCENE_HEIGHT = 920;

export default function PhaserCourtroom({ speakerRole, speakerName, dialogText, turnNumber }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const scene = new CourtroomScene();
    sceneRef.current = scene;

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: SCENE_WIDTH,
      height: SCENE_HEIGHT,
      backgroundColor: '#2a1a10',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
      },
      scene: scene,
      transparent: false,
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
    };
  }, []);

 useEffect(() => {
  const scene = sceneRef.current;
  if (!scene) return;

  const apply = () => {
    if (scene.applyState && scene.dialogBoxText && scene.load && !scene.load.isLoading()) {
      scene.applyState({ speakerRole, speakerName, dialogText });
    } else {
      setTimeout(apply, 100);
    }
  };
  apply();
}, [speakerRole, speakerName, dialogText, turnNumber]);

  return (
    <div className="paper p-2 overflow-hidden">
      <div
        ref={containerRef}
        className="w-full mx-auto"
        style={{ maxWidth: SCENE_WIDTH, aspectRatio: `${SCENE_WIDTH} / ${SCENE_HEIGHT}` }}
      />
    </div>
  );
}
