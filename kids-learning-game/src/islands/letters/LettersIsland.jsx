import IslandShell from '../common/IslandShell'
import { LEVELS, PAGES } from './modes'
import LettersPlay from './play/LettersPlay'

export const MODE_ID = 'letters'

/**
 * Остров букв: 18 режимов на трёх экранах (modes.js), игровой процесс — play/LettersPlay.jsx
 * (три сцены: причал / сундук / затонувший город).
 */
export default function LettersIsland(props) {
  return <IslandShell modeId={MODE_ID} title="🔤 Остров букв" levels={LEVELS} pages={PAGES} Lesson={LettersPlay} {...props} />
}
