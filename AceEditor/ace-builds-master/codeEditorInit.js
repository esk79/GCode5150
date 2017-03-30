(function( codeEditor, undefined ) { 
  var Range = ace.require('ace/range').Range;
  var editor1, 
      editor2, 
      session1, 
      session2, 
      doc1, 
      doc2;

  codeEditor.init = function() {
    console.log(codeEditor.interpretLine("lol"));
    editor1 = ace.edit("editor1");
    editor1.setTheme("ace/theme/twilight");
    editor1.session.setMode("ace/mode/gcode");
    editor1.setAutoScrollEditorIntoView(true);
    editor1.setOption("maxLines", 30);
    editor1.setOption("minLines", 20);
    editor1.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true
    });

    var editor2 = ace.edit("editor2");
    editor2.setTheme("ace/theme/twilight");
    editor2.session.setMode("ace/mode/text");
    editor2.setAutoScrollEditorIntoView(true);
    editor2.setOption("maxLines", 30);
    editor2.setOption("minLines", 20);
    editor2.setReadOnly(true);
    editor2.renderer.$cursorLayer.element.style.display = "none";
    editor2.setHighlightActiveLine(true);

    session1 = editor1.getSession();
    doc1 = session1.getDocument();

    session2 = editor2.getSession();
    doc2 = session2.getDocument();

    session1.on('changeScrollTop', function() {
      session2.setScrollTop(session1.getScrollTop())
    });

    session2.on('changeScrollTop', function() {
      session1.setScrollTop(session2.getScrollTop())
    });

    editor1.on("change", function(e) {
      //console.log(e);
      if(e.action == "insert") {
        var startCol = e.start.column;
        var startRow = e.start.row;
        var endCol = e.end.column;
        var endRow = e.end.row;

        for (var i = 0; i < e.lines.length; i++) {
            var lineNum = startRow + i;
            var line = e.lines[i];
            if (i < e.lines.length - 1 && e.lines.length > 1) {
              // This is a new line
              doc2.insert({row:lineNum, column:(i==0 ? startCol : 0)}, doc2.getNewLineCharacter());
            } 

            var doc1FullLine = doc1.getLine(lineNum);
            var newLine = codeEditor.interpretLine(doc1FullLine);
            session2.replace(new Range(lineNum, 0, lineNum, Number.MAX_VALUE), newLine);
        }
      }
      else if (e.action == "remove") {
        var startCol = e.start.column;
        var startRow = e.start.row;
        var endCol = e.end.column;
        var endRow = e.end.row;

        doc2.remove(new Range(startRow, startCol, endRow, endCol));
        var doc1FullLine = doc1.getLine(startRow);
        var newLine = codeEditor.interpretLine(doc1FullLine);
        session2.replace(new Range(startRow, 0, startRow, Number.MAX_VALUE), newLine);
      }
    });

    editor1.on("changeSelection", function() {
      var lineNum = editor1.getCursorPosition().row;
      editor2.gotoLine(lineNum+1, 0, false);
    });
  } 
}( window.codeEditor = window.codeEditor || {} ));