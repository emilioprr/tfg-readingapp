export default function Estrellas({ puntuacion }) {
    return (
        <span className="inline-flex items-center">
      {[1, 2, 3, 4, 5].map((estrella) => {
          let fill = 'empty'
          if (puntuacion >= estrella) fill = 'full'
          else if (puntuacion >= estrella - 0.5) fill = 'half'

          return (
              <span key={estrella} className="text-lg leading-none" style={{ width: '1.2em', display: 'inline-block', position: 'relative' }}>
            <span className="text-gray-600" style={{ position: 'absolute', left: 0, top: 0 }}>★</span>
                  {fill === 'full' && (
                      <span className="text-amber-400" style={{ position: 'absolute', left: 0, top: 0 }}>★</span>
                  )}
                  {fill === 'half' && (
                      <span className="text-amber-400" style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: '0.43em' }}>★</span>
                  )}
                  <span style={{ visibility: 'hidden' }}>★</span>
          </span>
          )
      })}
    </span>
    )
}