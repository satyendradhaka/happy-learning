$("#bookmark").click(function () {
  $("#add-bookmark-form").toggle();
  console.log(video.currentTime);
  timeStamp = Math.floor(video.currentTime);
  console.log(timeStamp);
  var min = Math.floor(timeStamp / 60);
  var sec = timeStamp % 60;
  if (sec < 10) {
    timeStamp = min + ":0" + sec;
  } else {
    timeStamp = min + ":" + sec;
  }
  document.getElementById("time").value = timeStamp;
});

$(".delete-item-form").submit(function (e) {
  e.preventDefault();
  var confirmResponse = confirm("Are you sure?");
  if (confirmResponse) {
    var actionUrl = $(this).attr("action");
    var $itemToDelete = $(this).closest(".list-group-item");
    $.ajax({
      url: actionUrl,
      type: "DELETE",
      itemToDelete: $itemToDelete,
      success: function (data) {
        this.itemToDelete.remove();
      },
    });
  } else {
    $(this).find("button").blur();
  }
});

$("#add-bookmark-form").submit(function (e) {
  e.preventDefault();
  $("#add-bookmark-form").toggle();
  var bookmarkItem = $(this).serialize();
  console.log(bookmarkItem);

  $.post(
    "/courses/<%=course._id%>/video/<%=video._id%>",
    bookmarkItem,
    function (data) {
      $("#bookmark-list").append(
        `<li class="list-group-item">
                    <span class="gotoBookmark" style="cursor: pointer;"><strong>${data.bookmark.timestamp}</strong><span>  : ${data.bookmark.text}
                    <div class="pull-right">
                    <form style="display: inline" method="POST" action="/courses/${data.course._id}/video/${data.video._id}/bookmark/${data.bookmark._id}" class="delete-item-form">
                        <button type="submit" class="btn btn-sm btn-danger"><i class="fa fa-trash" aria-hidden="true"></i></button>
                    </form>
                    </div>
                </li>`
      );

      $(".delete-item-form").submit(function (e) {
        e.preventDefault();
        var confirmResponse = confirm("Are you sure?");
        if (confirmResponse) {
          var actionUrl = $(this).attr("action");
          var $itemToDelete = $(this).closest(".list-group-item");
          $.ajax({
            url: actionUrl,
            type: "DELETE",
            itemToDelete: $itemToDelete,
            success: function (data) {
              this.itemToDelete.remove();
            },
          });
        } else {
          $(this).find("button").blur();
        }
      });
    }
  );

  $(this).find("#text").val("");
});

$(".gotoBookmark").click(function () {
  time = $(this).text();
  [min, sec] = time.split(":");
  time = 60 * min + Number(sec);
  video.currentTime = time;
});
