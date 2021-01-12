const BASE_URL = "https://jsonplace-univclone.herokuapp.com";

function fetchData(url) {
  return fetch(url)
    .then(function (response) {
      return response.json();
    })
    .catch(function (error) {
      console.log(error);
    });
}
/*****************************Users*****************************/
function fetchUsers() {
  return fetchData(`${BASE_URL}/users`);
}

function renderUser(user) {
  return $(` <div class="user-card">
    <header>
      <h2>${user.name}</h2>
    </header>
    <section class="company-info">
      <p>
        <b>Contact:</b> ${user.email}
      </p>
      <p>
        <b>Works for:</b> ${user.company.name}
      </p>
      <p>
        <b>Company creed:</b> "${user.company.catchPhrase}, which
        will ${user.company.bs}!"
      </p>
    </section>
    <footer>
      <button class="load-posts">POSTS BY ${user.username}</button>
      <button class="load-albums">ALBUMS BY ${user.username}</button>
    </footer>
  </div>`).data("user", user);
}

function renderUserList(userList) {
  $("#user-list").empty();

  userList.forEach(function (user) {
    $("#user-list").append(renderUser(user));
  });
}

/*****************************Albums*****************************/

/* get an album list, or an array of albums */
function fetchUserAlbumList(userId, user) {
  // if we already have albums, don't fetch them again
  if (user.albums) {
    return Promise.reject(null);
  }
  return fetchData(
    `${BASE_URL}/users/${userId}/albums?_expand=user&_embed=photos`
  ).then(function (albums) {
    user.albums = albums;
    return user.albums;
  });
}

/* render a single album */
function renderAlbum(album) {
  const albumCard = $(`<div class="album-card">
  <header>
    <h3>${album.title}, by ${album.user.username} </h3>
  </header>
  <section class="photo-list">      
  </section>
</div>`);

  album.photos.forEach(function (photo) {
    $(".photo-list").append(renderPhoto(photo));
  });
  return albumCard;
}

/* render a single photo */
function renderPhoto(photo) {
  return $(`<div class="photo-card">
    <a href="${photo.url}" target="_blank">
      <img src="${photo.thumbnailUrl}">
      <figure>${photo.title}</figure>
    </a>
  </div>`);
}

/* render an array of albums */
function renderAlbumList(albumList) {
  $("#app section.active").removeClass("active");
  $("#album-list").empty();
  $("#album-list").addClass("active");

  albumList.forEach(function (album) {
    $("#album-list").append(renderAlbum(album));
  });
}

/*****************************Posts*****************************/

function fetchUserPosts(userId, user) {
  // if we already have posts, don't fetch them again
  if (user.posts) {
    return Promise.reject(null);
  }

  return fetchData(`${BASE_URL}/users/${userId}/posts?_expand=user`).then(
    function (posts) {
      user.posts = posts;
      return user.posts;
    }
  );
}

function fetchPostComments(postId) {
  return fetchData(`${BASE_URL}/posts/${postId}/comments`);
}

function setCommentsOnPost(post) {
  // if we already have comments, don't fetch them again
  if (post.comments) {
    return Promise.reject(null);
  }

  // fetch, upgrade the post object, then return it
  return fetchPostComments(post.id).then(function (comments) {
    post.comments = comments;
    return post;
  });
}

function renderPost(post) {
  return $(`<div class="post-card">
    <header>
      <h3>${post.title}</h3>
      <h3>--- ${post.user.username}</h3>
    </header>
    <p>${post.body}</p>
    <footer>
      <div class="comment-list"></div>
      <a href="#" class="toggle-comments">(<span class="verb">show</span> comments)</a>
    </footer>
  </div>`).data("post", post);
}

function renderPostList(postList) {
  $("#app section.active").removeClass("active");
  $("#post-list").empty();
  $("#post-list").addClass("active");

  postList.forEach(function (post) {
    $("#post-list").append(renderPost(post));
  });
}

function toggleComments(postCardElement) {
  const footerElement = postCardElement.find("footer");

  if (footerElement.hasClass("comments-open")) {
    footerElement.removeClass("comments-open");
    footerElement.find(".verb").text("show");
  } else {
    footerElement.addClass("comments-open");
    footerElement.find(".verb").text("hide");
  }
}

/**************************Event Handlers*************************/

$("#user-list").on("click", ".user-card .load-posts", function () {
  const user = $(this).closest(".user-card").data("user");
  fetchUserPosts(user.id, user).then(renderPostList)
  .catch(function(){renderPostList(user.posts)});
});

$("#user-list").on("click", ".user-card .load-albums", function () {
  const user = $(this).closest(".user-card").data("user");
  fetchUserAlbumList(user.id, user).then(renderAlbumList)
  .catch(function(){renderAlbumList(user.albums)});
});

$("#post-list").on("click", ".post-card .toggle-comments", function () {
  const postCardElement = $(this).closest(".post-card");
  const post = postCardElement.data("post");

  setCommentsOnPost(post)
    .then(function (post) {
      console.log("building comments for the first time...", post);
      $(".comment-list").empty();
      post.comments.forEach(function (comment) {
        $(".comment-list").prepend(
          $(`
          <h3>${comment.body} --- ${comment.email}</h3>
        `)
        );
      });
      toggleComments(postCardElement);
    })
    .catch(function () {
      console.log("comments previously existed, only toggling...", post);
      toggleComments(postCardElement);
    });
});

function bootstrap() {
  fetchUsers().then(renderUserList);
}

bootstrap();
