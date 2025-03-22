use modinfo_parser::Mod;

#[test]
fn parse_real_xml() {
    let xml = include_str!("data/modinfos/ai.modinfo");
    let mod_xml = Mod::parse(xml.as_bytes()).unwrap();
    assert_eq!(mod_xml.id.as_deref(), Some("rhq"));
    dbg!(&mod_xml);
}
