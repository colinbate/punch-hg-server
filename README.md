# Punch Hg Server

A node.js static web server which will generate a [Punch][p] site based on pushes to a
mercurial ([Bitbucket][bb]) repository.

## Quick start

Not interested in the whats and the whys?

1. Download [node.js][dn]
2. Clone (`hg clone https://colinbate@bitbucket.org/colinbate/punch-hg-server`) or [download][dl]
   this repository (until I sort out getting it up on NPM)
3. Edit `config.json` with your desired port and the repository containing your Punch site.
4. `node index.js`
5. Set up the [POST service][bp] on your Bitbucket repository to hit `<your site>/_update`

## Inspiration

For those who aren't familiar, [Punch][p] is a static site generator built on Node.js which
uses Mustache templating and Markdown to create a site which can be rendered out to plain HTML,
CSS and JavaScript. Obviously the ease of deploying static sites is quite appealing, particularly
when you consider that both Github and Bitbucket offer it for free with their services.

In fact, when reading up on the [Github Pages][gp] I realized that beyond a normal static site,
they would run your files through Jekyll which is another site generator (written in Ruby). I
liked that idea, because you don't need to keep the output of your site generator stored in
the repository, just the sources.

Not a huge Ruby fan, I was hoping to dive into the world of Punch. Also there are static site
tools based around Git and Github, I wanted something I could use with Mercurial and [Bitbucket][bb].
Enter the **Punch Hg Server**.

## What it does

This server has two parts, the first part waits for POSTs to `/_update` and connects to your remote
repository and fetches everything into a subfolder on your server, it then runs `punch generate`
to build your input files into a static site. The second part is simply a static web server for that
punch generated site. That's it.

It was originally imagined to be used with Bitbucket's [POST service][bp], but I'm going to try
writing an extension for Mercurial in general to notify this way. The nice thing about Bitbucket
is that with their new [online editing][be], you don't even need a local copy of your source files
to update your site. Very convenient.

[p]: http://laktek.github.io/punch/
[bb]: http://bitbucket.org
[be]: http://blog.bitbucket.org/2013/05/14/edit-your-code-in-the-cloud-with-bitbucket/
[gp]: http://pages.github.com/
[dn]: http://nodejs.org/download/
[dl]: https://bitbucket.org/colinbate/punch-hg-server/get/tip.zip
[bp]: https://confluence.atlassian.com/display/BITBUCKET/POST+Service+Management