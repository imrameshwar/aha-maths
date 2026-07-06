export default {
  id:         '001-area-of-circle',
  visualizer: 'area-of-circle',
  seed:       42,
  params:     {},

  intro: {
    title: 'Area = πr²',
    hook:  'Why πr²? 🍕',
  },
  outro: {
    cta:  "Follow for more 'aha' maths",
    next: '',
  },

  // Timed subtitle pills (seconds into CONTENT, shown above caption zone).
  // English labels so the visual travels globally; Hinglish lives in the VO.
  beats: [
    { t: 0.0,  text: 'Area of a circle?' },
    { t: 2.5,  text: 'Slice it into wedges' },
    { t: 5.5,  text: 'Rearrange them…' },
    { t: 9.0,  text: "It's a rectangle!" },
    { t: 11.0, text: 'width = πr · height = r' },
    { t: 13.5, text: 'Area = πr × r = πr²' },
  ],
};
