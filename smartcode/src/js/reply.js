function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function say($reactions, text) {
  $reactions.answer(text);
}
