/**
 * TODO -- will be used to do a merge of incoming props
 * @param existing 
 * @param incoming 
 */
export function mergePropertyChanges(existing: object, incoming: object): object {
    return Object.assign({}, existing, incoming)
}