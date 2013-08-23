# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'webcastjs/rails/version'

Gem::Specification.new do |spec|
  spec.name          = "webcastjs-rails"
  spec.version       = Webcastjs::Rails::VERSION
  spec.authors       = ["Tony Miller"]
  spec.email         = ["mcfiredrill@gmail.com"]
  spec.description   = "A gem that wraps up webcast.js for use in the asset pipeline."
  spec.summary       = "gem for using webcast.js with rails"
  spec.homepage      = "https://github.com/mcfiredrill/webcastjs-rails"
  spec.license       = "MIT"

  spec.files         = `git ls-files`.split($/)
  spec.require_paths = ["lib"]

  spec.add_dependency "railties"
  spec.add_development_dependency "bundler", "~> 1.3"
  spec.add_development_dependency "rake"
end
