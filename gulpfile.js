var gulp = require('gulp');

// Plugins
var connect = require('gulp-connect-php'),
	browserSync = require('browser-sync').create(),
	httpProxyMiddleware = require('http-proxy-middleware'),
	clean = require('gulp-clean'),
	uglify = require('gulp-uglify'),
    minify = require('gulp-minify-css'),
	concat = require('gulp-concat'),
	runSequence = require('run-sequence');

// Deploy path (use the DocumentRoot of your local Apache)
var deployPath = "C:/JESUS LISING/htdocs/phpstyleguide";

// Configuration for files to publish
var assetsConfig = require('./assets.json');

// Clean
gulp.task('clean', function () {
    return gulp.src(deployPath + '/*')
        .pipe(clean({force: true}));
});

//Merge custom javascripts
gulp.task('merge-vendor-js', function () {
    return gulp.src(assetsConfig.vendorJs)
    	.pipe(uglify())
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest(deployPath + '/js/'));
});

//Merge custom css
gulp.task('merge-vendor-css', function () {
    return gulp.src(assetsConfig.vendorCss)
    	.pipe(minify({comments: true, spare: true}))
        .pipe(concat('vendor.css'))
        .pipe(gulp.dest(deployPath + '/css/'));
});

// Merge custom javascripts
gulp.task('merge-custom-js', function () {
    return gulp.src(assetsConfig.customJs)
    	.pipe(uglify())
        .pipe(concat('custom.js'))
        .pipe(gulp.dest(deployPath + '/js'));
});

// Merge custom css
gulp.task('merge-custom-css', function () {
    return gulp.src(assetsConfig.customCss)
    	.pipe(minify({comments: true, spare: true}))
        .pipe(concat('custom.css'))
        .pipe(gulp.dest(deployPath + '/css/'));
});

gulp.task('merge-js-css',['merge-vendor-js','merge-custom-js','merge-vendor-css','merge-custom-css']);

// Copy images
gulp.task('copy-images', function () {
    return gulp.src(assetsConfig.images)
        .pipe(gulp.dest(deployPath + '/img'));
});

//Copy images
gulp.task('copy-fonts', function () {
    return gulp.src(assetsConfig.fonts)
        .pipe(gulp.dest(deployPath + '/fonts'));
});

// Copy html files, do not include the bower_components folder
gulp.task('copy-html', function () {
    return gulp.src(['./app/**/*.html', '!./bower_components/**'])
        .pipe(gulp.dest(deployPath));
});

//Copy php files, do not include the bower_components folder
gulp.task('copy-php', function () {
    return gulp.src(['./app/**/*.php'])
        .pipe(gulp.dest(deployPath));
});

//Create server
gulp.task('connect', function() {
	var target = "http://jsonplaceholder.typicode.com";
	var contextPath = "";
	var redirectStatusCode = [301, 302, 307, 308];
	
	return connect.server({}, function (){
	    browserSync.init({
	      proxy: 'localhost',
	      browser: ['firefox'],
	      open: true,
	      middleware: [
					httpProxyMiddleware('/api', {
					    target: target,
					    changeOrigin: true,
					    logLevel: 'debug',
					    pathRewrite: {
					      '^/api' : contextPath
					    },
					    onProxyRes : function(proxyRes, req, res) {
					       if(proxyRes.headers['set-cookie'] && proxyRes.headers['set-cookie'].length) {
					         proxyRes.headers['set-cookie'][0] = proxyRes.headers['set-cookie'][0].replace(contextPath, "");
					       }
					       delete proxyRes.headers['x-removed'];
					
					       if(redirectStatusCode.indexOf(proxyRes.statusCode) > -1) {
					         proxyRes.headers['location'] =  proxyRes.headers['location'].replace(target + contextPath, "http://" + host + ":" + port)
					       }
					    }
					})     
	      ]
	    });
	});
});

// Watch changes
gulp.watch(["app/**/*.php",
            "app/**/*.html",
            "app/**/*.js"], function(){
			runSequence(['copy-php','copy-html','copy-images','merge-js-css'], browserSync.reload)
});

//Build local
gulp.task('build-local', function (callback) {
    runSequence('clean', ['copy-php','copy-html','copy-images','copy-fonts', 'merge-js-css'], 'connect', callback);
});

gulp.task('default', ['build-local']);