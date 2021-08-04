import {createCompiler} from './lib/compiler.js'

export default function remarkMan(options) {
  this.Compiler = createCompiler(options || {})
}
