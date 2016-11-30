  function rerenderButtonStates() {
    if (addCommentMode && highlightMode) {
      alert("WARNING! addCommentMode && highlightMode are both true!!");
    }

    // settings for add comment button
    if(addCommentMode){
      $('#addCommentButton').css('color', 'red');
      $("#addCommentButton").css("pointer-events", "auto");
    } else if(!highlightMode) {
      $('#addCommentButton').css('color', 'white');
      $("#addCommentButton").css("pointer-events", "auto");
    } else {
      $('#addCommentButton').css('color', 'grey');
      $("#addCommentButton").css("pointer-events", "none"); 
    }

    // settings for highlight button
    if(highlightMode){
      $('#highlightButton').css('color', 'red');
      $("#highlightButton").css("pointer-events", "auto");
    } else if(!addCommentMode) {
      $('#highlightButton').css('color', 'white');
      $("#highlightButton").css("pointer-events", "auto");
    } else {
      $('#highlightButton').css('color', 'grey');
      $("#highlightButton").css("pointer-events", "none"); 
    }
  }


  function redraw(showClient = -1){
    lastShowClient = showClient;

    context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
    
    for (var i = 0; i < orderedStrokeIds.length; i++) {
      var strokeId = orderedStrokeIds[i];
      if (showClient != -1 && showClient != strokeId.authorClientId) {
        continue;
      }

      if (strokeMap[strokeId.authorClientId] == null) {
        // no idea what's going on but this could be null
        continue;
      }

      var strokeData = strokeMap[strokeId.authorClientId][strokeId.authorStrokeId];
      if (typeof(strokeData) === "undefined") {
        continue; // perhaps we haven't gotten around to adding the stroke to strokeMap yet
      }

      var dataPoints = strokeData.dataPoints;

      if (dataPoints == null) {
        // no idea what's going on but this could be null
        continue;
      }

      // sometimes we are told about the stroke before we get data about it
      if (dataPoints.length < 1) {
        continue;
      }

      context.strokeStyle = gColorList[strokeData.colorId];

      context.beginPath();
      // draw a tiny line to show the first dot
      context.moveTo(dataPoints[0].location_x - 1, dataPoints[0].location_y);
      context.lineTo(dataPoints[0].location_x, dataPoints[0].location_y);

      for (var j = 1; j < dataPoints.length; j++) {
        context.moveTo(dataPoints[j-1].location_x, dataPoints[j-1].location_y);
        context.lineTo(dataPoints[j].location_x, dataPoints[j].location_y);
      }
      context.closePath();
      context.stroke();
    }
  }

  function rerenderComments() {

    if(textareahidden){ return; }

    $('.info').remove();

    function addTextArea(commentId, comment) {
      if (!comment) {
        return;
      }

      var division = document.createElement('div'); 
      division.className = 'info';
      division.style = "width:150px; height:150px;";
      division.id = commentId;

      var label = document.createElement('label');
      label.className = 'textareaLabel';
      if (comment.authorClientId == gClientId){
        label.innerHTML = "You";
        label.style.color = 'blue';
      }
      else{
        var userName = "User#" + String(comment.authorClientId);
        label.innerHTML = userName;
        label.style.color = 'red';
      }
      
      var userComments = document.createElement('textarea');
      userComments.name = 'textarea' + textareaindex;
      userComments.className = 'userComment';
      userComments.id = "commentId" + commentId;

      division.addEventListener(mouseDown, function mouseDownOnTextarea(e) {
          if (comment.authorClientId != gClientId) {return};

          var x = this.offsetLeft - e.pageX,
              y = this.offsetTop - e.pageY;
          function drag(e) {
              this.style.left = e.pageX + x + 'px';
              this.style.top = e.pageY + y + 'px';
              comment.value = this.children[1].value;
              comment.xPos = parseInt(division.style.left);
              comment.yPos = parseInt(division.style.top);
              socket.emit("edit comment", this.id, this.children[1].value, parseInt(this.style.left), parseInt(this.style.top) );
          }
          function stopDrag() {
              this.removeEventListener(mouseMove, drag);
              this.removeEventListener(mouseUp, stopDrag);
          }
          this.addEventListener(mouseMove, drag);
          this.addEventListener(mouseUp, stopDrag);
      });
      division.addEventListener('dblclick', function remove(){
        if (comment.authorClientId != gClientId) {return};
        comments[commentId] = undefined;
        this.remove();
        socket.emit('delete comment', division.id);
      });


      userComments.value = comment.message;
      division.style.top = comment.yPos + 'px';
      division.style.left = comment.xPos + 'px';
      document.body.appendChild(division);
      document.getElementById(commentId).appendChild(label);
      document.getElementById(commentId).appendChild(userComments);

      var commited = false;
      $('#' + "commentId" + commentId).emojioneArea({
        pickerPosition: "left",
        tonesStyle: "bullet",
        events: {
          blur: function (editor, event) {
            if (comment.authorClientId != gClientId) {
              this.setText(comment.message);
              return};
            if (userComments.value != "") {
              comment.message = userComments.value;
              comment.xPos = parseInt(division.style.left);
              comment.yPos = parseInt(division.style.top);
              if (commentId == "tempId" && !commited) {
                commited = true;

                socket.emit("add comment", userComments.value, parseInt(division.style.left), parseInt(division.style.top) );
                socket.on("id for new comment", function(commentId) {
                   division.id = commentId;
                   comments[commentId] = comment;
                   newTempComment = undefined;
                });
              } else {
                  socket.emit("edit comment", division.id, userComments.value, parseInt(division.style.left), parseInt(
                  division.style.top));
              }
            }
          }
        }
      });
    }

    // $.each(comments, addTextArea);

    for ( var index in comments ) {

      if ( comments[index] != undefined){
        addTextArea(index, comments[index]);
      }
    }

    if (typeof(newTempComment) !== "undefined") {
      addTextArea("tempId", newTempComment);
    }
  }