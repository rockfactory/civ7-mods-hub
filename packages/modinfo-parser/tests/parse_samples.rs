use modinfo_parser::Mod;

#[test]
fn parse_samples() {
    insta::glob!("samples/*.modinfo", |path| {
        let text = std::fs::read_to_string(path).unwrap();
        let parsed = Mod::parse(text.as_bytes()).unwrap();
        insta::with_settings!({ sort_maps => true }, {
            insta::assert_debug_snapshot!(parsed);
            let serialized = parsed.to_string().unwrap();
            let reparsed = Mod::parse(serialized.as_bytes()).unwrap();
            assert_eq!(parsed, reparsed);
        });
    });
}
