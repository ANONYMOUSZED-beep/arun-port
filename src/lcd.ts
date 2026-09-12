// Original 3x5 glyphs keep each character aligned to the LCD's integer pixel grid.
const glyphs: Record<string, string> = {
  A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'101111111111101',O:'010101101101010',P:'110101110100100',Q:'010101101111011',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',Z:'111001010100111',
  '0':'111101101101111','1':'010110010010111','2':'110001010100111','3':'110001010001110','4':'101101111001001','5':'111100110001110','6':'011100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001110',
  '.':'000000000000010',',':'000000000010100',':':'000010000010000',';':'000010000010100','/':'001001010100100','-':'000000111000000','+':'000010111010000','&':'010101010101011','(':'001010010010001',')':'100010010010100','?':'110001010000010','!':'010010010000010',"'":'010010000000000','%':'101001010100101','#':'101111101111101','>':'100010001010100','<':'001010100010001','=':'000111000111000','_':'000000000000111','*':'000101010101000','|':'010010010010010','@':'111101111100111'
};
export const LCD_WIDTH = 84;
export const LCD_HEIGHT = 48;
export interface Display { title: string; lines: string[]; selected?: number; footer: string; page?: string; home?: boolean; off?: boolean }
export function draw(canvas: HTMLCanvasElement, display: Display, progress: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  // Each logical pixel has a subtle inter-pixel gap; the 4x backing store remains nearest-neighbour scaled.
  const unit = 4;
  const ink = '#203019';
  const paper = '#a2b078';
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 336, 192);
  const rect = (x: number, y: number, w: number, h: number, color = ink) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * unit, y * unit, w * unit, h * unit);
  };
  const text = (value: string, x: number, y: number, inverse = false) => {
    for (const [index, char] of [...value.toUpperCase()].entries()) {
      const bits = glyphs[char] || (char === ' ' ? '' : glyphs['?']);
      for (let p = 0; p < bits.length; p++) if (bits[p] === '1') {
        ctx.fillStyle = inverse ? paper : ink;
        ctx.fillRect((x + index * 4 + p % 3) * unit, (y + Math.floor(p / 3)) * unit, 3.6, 3.6);
      }
    }
  };
  if (display.off) return;
  if (display.home) {
    for (let i = 0; i < 4; i++) rect(2 + i * 2, 7 - i * 2, 1, i * 2 + 1);
    text(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), 33, 2);
    rect(72, 2, 10, 5); rect(73, 3, 8, 3, paper); rect(82, 3, 1, 3);
    rect(74, 3, 2 + Math.min(5, progress), 3);
    text('ARUNESH', 28, 15); text('WARAN', 32, 22);
    text('AI / ML / WEB', 16, 33);
  } else {
    text(display.title.slice(0, display.page ? 13 : 19), 2, 1);
    if (display.page) text(display.page.slice(0, 5), 83 - display.page.length * 4, 1);
    rect(1, 8, 82, 0.4);
    display.lines.slice(0, 4).forEach((line, index) => {
      const y = 11 + index * 7;
      if (display.selected === index) rect(1, y - 1, 79, 7);
      text(line.slice(0, 19), 3, y, display.selected === index);
    });
  }
  rect(1, 40, 82, 0.4);
  text(display.footer, Math.floor((84 - display.footer.length * 4) / 2), 42);
}
