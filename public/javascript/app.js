//Scrape from the adventures website and display the articles.
$("#scrapeNow").on("click", function (event) {
  event.preventDefault();

  $.ajax("/scrape", {
    type: "GET"
  }).then(
    function () {
      $.ajax("/articles", {
        type: "GET"
      }).then(
        function (data) {
          console.log(data);
          window.location.replace("/articles");
        });
    });
});

//Create note
$(".create-form").on("submit", function (event) {
  event.preventDefault();

  var id = $(this).find(".articleAddId").val();
  var noteBody = $(this).find("#notebody").val().trim();

  $(this).find("#notebody").val('')

  //Only accept input into note body area
  if (noteBody !== '') {
    var newNote = {
      body: noteBody,
    };
    // Send the POST request.
    $.ajax("/articles/" + id, {
      type: "POST",
      data: newNote
    }).then(
      function () {
        // Reload page 
        location.reload();
      }
    );
  }
});

//Delete the note
$(".delete").on("click", function (event) {
  event.preventDefault();
  var id = $(this).find(".noteAddId").val();
  $.ajax("/notes/delete/" + id, {
    method: "GET"
  }).then(
    function () {
      location.reload();
    });
});
// });

