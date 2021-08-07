import {main} from "./arithmetic_example/main";
import {main as pmain} from "./parser_builder/main";

interface Options {
    build_root_bnf_tables: boolean;
    build_tables: boolean;
    parse: boolean;
}

console.log("Grammar Parser v1");
pmain().then(() => main());
