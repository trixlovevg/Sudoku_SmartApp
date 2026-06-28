function action(type, payload) {
  return Object.assign({ type: type }, payload || {});
}

function sendAction($response, type, payload) {
  var data = action(type, payload);
  $response.reactions = $response.reactions || [];
  $response.reactions.push({ type: 'smart_app_data', data: data });
}
