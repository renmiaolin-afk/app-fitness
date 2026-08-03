Component({
  options: {
    // 根节点即为 .ambient，才能相对 .page 绝对定位
    virtualHost: true,
    styleIsolation: 'isolated'
  }
})
