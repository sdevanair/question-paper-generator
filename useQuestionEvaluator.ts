declare global {
  interface Window {
    Module: any;
  }
}

export async function loadEvaluator() {
  return new Promise((resolve) => {
    if (window.Module) {
      resolve(window.Module);
      return;
    }

    window.Module = {
      onRuntimeInitialized: function() {
        console.log('WebAssembly Runtime Initialized');
        resolve(window.Module);
      }
    };

    const script = document.createElement('script');
    script.src = '/question_evaluator.js';
    document.body.appendChild(script);
  }).then((Module: any) => {
    return {
      _add_question: Module.cwrap('add_question', null, ['number', 'number']),
      _get_total_marks: Module.cwrap('get_total_marks', 'number', []),
      _get_average_difficulty: Module.cwrap('get_average_difficulty', 'number', []),
      _get_top_question_marks: Module.cwrap('get_top_question_marks', 'number', []),
      _undo_last_question: Module.cwrap('undo_last_question', null, [])
    };
  });
}
  